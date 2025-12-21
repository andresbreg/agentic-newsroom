"""
Extractor Service - Named Entity Recognition (NER) with SpaCy

Handles local entity extraction from news items using SpaCy.
Processes both translated news and native Spanish news.
"""

import spacy
import logging
import re
from sqlalchemy.orm import Session
from models import NewsItem, Entity
from typing import List

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
    if label not in SPACY_TO_DB_MAP:
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

def _extract_from_item(db: Session, item: NewsItem):
    """Internal helper to process a single NewsItem."""
    try:
        # Use Spanish content if available (translated), else fallback to original (native ES)
        title = item.title_es or item.title
        content = item.content_es or item.content_snippet or ""
        text = f"{title}. {content}".strip()
        
        doc = nlp(text)
        seen_entities = set()
        entities_added = 0
        
        for ent in doc.ents:
            ent_name = ent.text.strip()
            ent_label = ent.label_
            
            if not is_valid_entity(ent_name, ent_label):
                continue
                
            # Deduplication
            if ent_name.lower() in seen_entities:
                continue
            seen_entities.add(ent_name.lower())
            
            db_type = SPACY_TO_DB_MAP[ent_label]
            
            # Check existing
            existing_entity = db.query(Entity).filter(Entity.name.ilike(ent_name)).first()
            
            if existing_entity and existing_entity.is_ignored:
                continue
                
            if not existing_entity:
                existing_entity = Entity(name=ent_name, type=db_type)
                db.add(existing_entity)
                db.flush()
                
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
    
    query = db.query(NewsItem).filter(NewsItem.entities_extracted == False)
    if item_ids:
        query = query.filter(NewsItem.id.in_(item_ids))
    else:
        query = query.filter(NewsItem.title_es != None).limit(10)
        
    items = query.all()
    count = 0
    for item in items:
        if _extract_from_item(db, item):
            count += 1
    db.commit()
    return count

def process_native_pending(db: Session) -> int:
    """Processes native Spanish items (Flow B)."""
    if nlp is None: return 0
    
    # Query items that are ES and have not been processed.
    items = db.query(NewsItem).filter(
        NewsItem.language == "es",
        NewsItem.entities_extracted == False
    ).limit(100).all()
    
    if not items:
        return 0
        
    logger.info(f"[EXTRACTOR] Procesando {len(items)} noticias NATIVAS ES con SpaCy...")
    count = 0
    for item in items:
        if _extract_from_item(db, item):
            count += 1
    db.commit()
    return count
