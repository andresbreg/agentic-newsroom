"""
Extractor Service - Named Entity Recognition (NER) with SpaCy

Handles local entity extraction from news items using SpaCy.
Processes both translated news and native Spanish news.
"""

import spacy
from spacy.matcher import PhraseMatcher
import logging
import re
from sqlalchemy.orm import Session
from models import NewsItem, Entity
from typing import List, Optional, Set

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load SpaCy model globally
try:
    logger.info("[EXTRACTOR] Cargando modelo SpaCy 'es_core_news_lg'...")
    nlp = spacy.load("es_core_news_lg")
    logger.info("[EXTRACTOR] Modelo cargado exitosamente")
except Exception as e:
    logger.error(f"[EXTRACTOR] Error al cargar el modelo SpaCy: {e}")
    nlp = None

# Mapping SpaCy labels to DB Enums
# We only care about PER, ORG, LOC, GPE
SPACY_TO_DB_MAP = {
    "PER": "PERSON",
    "ORG": "ORGANIZATION",
    "GPE": "LOCATION",
    "LOC": "LOCATION"
}

STOP_PREFIXES = ("El ", "La ", "Los ", "Las ", "Un ", "Una ", "En ", "De ", "Para ", "Por ", "Con ", "Sobre ", "Según ")

def is_valid_entity(text: str, label: str) -> bool:
    """
    Apply heuristic filters to avoid 'garbage' entities.
    """
    if not text:
        return False
        
    # Mapping check only for SPACY labels. 
    # For Matcher results (CONCEPT), we skip label mapping check here 
    # as we already know we want it.
    if label not in SPACY_TO_DB_MAP and label != "CONCEPT":
        return False
        
    # 1. Stopwords/Articles at the start (Case Insensitive)
    text_lower = text.lower()
    if any(text_lower.startswith(p.lower()) for p in STOP_PREFIXES):
        return False
        
    # 2. Length check (2 to 50 chars)
    if not (2 <= len(text) <= 50):
        return False
        
    # 3. Excessive Punctuation or Special Chars
    if "\n" in text or "\t" in text:
        return False
        
    if re.search(r'[.]{2,}|["]{2,}', text): # Excessive dots or quotes
        return False
        
    # 4. Must not be just a number or special symbols
    if text.replace(" ", "").isdigit():
        return False
        
    return True

def load_watchlist_matcher(db: Session, nlp_obj: spacy.language.Language) -> Optional[PhraseMatcher]:
    """
    Loads active entity names from Entity table into a SpaCy PhraseMatcher.
    """
    try:
        # Load entities that are NOT ignored
        active_entities = db.query(Entity).filter(Entity.is_ignored == False).all()
        
        if not active_entities:
            return None
            
        matcher = PhraseMatcher(nlp_obj.vocab, attr="LOWER")
        # Use a set to avoid duplicates and convert to doc objects
        patterns = [nlp_obj.make_doc(e.name) for e in active_entities]
        
        if not patterns:
            return None
            
        matcher.add("WATCH_LIST", patterns)
        
        logger.info(f"[EXTRACTOR] Watch List cargada: {len(patterns)} entidades activas")
        return matcher
    except Exception as e:
        logger.error(f"[EXTRACTOR] Error al cargar Watch List: {e}")
        return None

def get_blacklisted_names(db: Session) -> Set[str]:
    """Returns a set of lowercase names of ignored entities."""
    ignored = db.query(Entity.name).filter(Entity.is_ignored == True).all()
    return {name[0].lower() for name in ignored}

def _extract_from_item(db: Session, item: NewsItem, matcher: PhraseMatcher = None, blacklist: Set[str] = None):
    """Internal helper to process a single NewsItem."""
    if blacklist is None:
        blacklist = set()
        
    try:
        # Use Spanish content if available (translated), else fallback to original (native ES)
        title = item.title_es or item.title
        content = item.content_es or item.content_snippet or ""
        text = f"{title}. {content}".strip()
        
        doc = nlp(text)
        entities_to_save = {} # name_lower -> (name, type)
        
        # Step 1: Statistical NER
        for ent in doc.ents:
            ent_name = ent.text.strip()
            ent_name_lower = ent_name.lower()
            ent_label = ent.label_
            
            # Skip if in blacklist
            if ent_name_lower in blacklist:
                continue
                
            if is_valid_entity(ent_name, ent_label):
                db_type = SPACY_TO_DB_MAP[ent_label]
                entities_to_save[ent_name_lower] = (ent_name, db_type)
        
        # Step 2: Deterministic Matcher (Watch List)
        if matcher:
            matches = matcher(doc)
            for match_id, start, end in matches:
                span = doc[start:end]
                ent_name = span.text.strip()
                ent_name_lower = ent_name.lower()
                
                # If already found by NER, NER type is already there.
                # If NOT found by NER, add it as valid entity.
                if ent_name_lower not in entities_to_save:
                    # CONCEPT is used as default for matcher results if not in NER
                    if is_valid_entity(ent_name, "CONCEPT"):
                        entities_to_save[ent_name_lower] = (ent_name, "CONCEPT")

        # Step 3: Save and Link
        entities_added = 0
        for name_lower, (ent_name, ent_type) in entities_to_save.items():
            # Check existing (ilike for case-insensitive match)
            existing_entity = db.query(Entity).filter(Entity.name.ilike(ent_name)).first()
            
            # Double check ignore status (even if not in batch blacklist yet)
            if existing_entity and existing_entity.is_ignored:
                continue
                
            if not existing_entity:
                existing_entity = Entity(name=ent_name, type=ent_type)
                db.add(existing_entity)
                db.flush()
            else:
                # If entity exists, we preserve its type from DB, but we already have its name
                pass
                
            if existing_entity not in item.entities:
                item.entities.append(existing_entity)
                entities_added += 1
                
        item.entities_extracted = True
        logger.info(f"  > Item {item.id}: {entities_added} entidades vinculadas ({item.language})")
        return True
    except Exception as e:
        logger.error(f"[EXTRACTOR] Error in item {item.id}: {e}")
        item.entities_extracted = True # Mark to avoid retrying indefinitely
        return False

def process_pending_entities(db: Session, item_ids: List[int] = None) -> int:
    """Processes translated items (Flow A)."""
    if nlp is None: return 0
    
    # Load Watch List Matcher and Black List once per batch
    matcher = load_watchlist_matcher(db, nlp)
    blacklist = get_blacklisted_names(db)
    
    query = db.query(NewsItem).filter(NewsItem.entities_extracted == False)
    if item_ids:
        query = query.filter(NewsItem.id.in_(item_ids))
    else:
        query = query.filter(NewsItem.title_es != None).limit(10)
        
    items = query.all()
    count = 0
    for item in items:
        if _extract_from_item(db, item, matcher, blacklist):
            count += 1
    db.commit()
    return count

def process_native_pending(db: Session) -> int:
    """Processes native Spanish items (Flow B)."""
    if nlp is None: return 0
    
    # Load Watch List Matcher and Black List once per batch
    matcher = load_watchlist_matcher(db, nlp)
    blacklist = get_blacklisted_names(db)
    
    # Query items that are ES and have not been processed.
    items = db.query(NewsItem).filter(
        NewsItem.language == "es",
        NewsItem.entities_extracted == False
    ).limit(100).all()
    
    if not items:
        return 0
        
    logger.info(f"[EXTRACTOR] Procesando {len(items)} noticias NATIVAS ES con SpaCy (+ WatchList & BlackList)...")
    count = 0
    for item in items:
        if _extract_from_item(db, item, matcher, blacklist):
            count += 1
    db.commit()
    return count
