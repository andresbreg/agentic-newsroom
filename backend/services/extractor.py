"""
Extractor Service - Named Entity Recognition (NER)

Handles entity extraction from Spanish-translated news items using Groq.
Processes items where title_es IS NOT NULL AND entities_extracted = FALSE.
"""

import os
import json
from sqlalchemy.orm import Session
from models import NewsItem, Entity
from groq import Groq
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def process_pending_entities(db: Session) -> int:
    """
    Extract named entities from translated news items using Groq.
    
    Only processes items that:
    - Have been translated (title_es IS NOT NULL)
    - Haven't been processed yet (entities_extracted = FALSE)
    
    Returns:
        int: Number of items processed
    """
    # Select items ready for entity extraction
    pending_items = db.query(NewsItem).filter(
        NewsItem.title_es != None,
        NewsItem.entities_extracted == False
    ).limit(5).all()  # Process in batches of 5
    
    if not pending_items:
        logger.info("[EXTRACTOR] No pending items for entity extraction")
        return 0
    
    logger.info(f"[EXTRACTOR] Found {len(pending_items)} items ready for entity extraction")
    
    # Initialize Groq client
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("API_KEY")
    model = os.getenv("MODEL", "llama-3.1-8b-instant")
    
    if not api_key:
        logger.error("[EXTRACTOR] GROQ_API_KEY not found in environment")
        return 0
    
    client = Groq(api_key=api_key)
    processed_count = 0
    
    for item in pending_items:
        try:
            # Prepare text for NER (use Spanish version)
            text = f"{item.title_es}. {item.content_es or ''}".strip()
            
            prompt = f"""Analiza el siguiente texto en español y extrae las entidades nombradas más relevantes.

Categorías:
- PERSONA: Nombres de personas
- ORGANIZACION: Empresas, instituciones, organizaciones
- LUGAR: Países, ciudades, ubicaciones geográficas
- CONCEPTO: Conceptos importantes, eventos, tecnologías

Texto: {text}

Devuelve SOLO un objeto JSON con este formato exacto:
{{
  "entities": [
    {{"name": "nombre de la entidad", "type": "PERSONA|ORGANIZACION|LUGAR|CONCEPTO"}}
  ]
}}"""

            try:
                response = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "Eres un sistema especializado en extracción de entidades nombradas. Devuelve SOLO JSON válido."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model=model,
                    response_format={"type": "json_object"},
                    temperature=0.3
                )
                
                result_text = response.choices[0].message.content
                result = json.loads(result_text)
                
                extracted_entities = result.get("entities", [])
                entities_linked = 0
                
                for ent_data in extracted_entities:
                    name = ent_data.get("name")
                    ent_type = ent_data.get("type", "CONCEPTO").upper()
                    
                    if not name:
                        continue
                    
                    # Find or create entity (case-insensitive)
                    entity = db.query(Entity).filter(
                        Entity.name.ilike(name)
                    ).first()
                    
                    # Check if entity is ignored
                    if entity and entity.is_ignored:
                        logger.info(f"[EXTRACTOR] Skipping ignored entity: {name}")
                        continue
                    
                    if not entity:
                        entity = Entity(
                            name=name,
                            type=ent_type
                        )
                        db.add(entity)
                        db.flush()
                    
                    # Link to news item if not already linked
                    if entity not in item.entities:
                        item.entities.append(entity)
                        entities_linked += 1
                
                logger.info(f"[EXTRACTOR] Item {item.id}: Linked {entities_linked} entities")
                
            except json.JSONDecodeError as e:
                logger.error(f"[EXTRACTOR] JSON parsing error for item {item.id}: {e}")
            except Exception as e:
                logger.error(f"[EXTRACTOR] Groq NER failed for item {item.id}: {e}")
            
            # Mark as processed regardless of success/failure
            item.entities_extracted = True
            processed_count += 1
            
        except Exception as e:
            logger.error(f"[EXTRACTOR] Error processing item {item.id}: {e}")
            # Still mark as processed to avoid infinite retry
            item.entities_extracted = True
    
    db.commit()
    logger.info(f"[EXTRACTOR] Completed processing {processed_count} items")
    return processed_count
