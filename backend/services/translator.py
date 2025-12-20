"""
Translator Service - Language Detection & Translation

Handles language detection and translation to Spanish using Groq.
Processes items where title_es IS NULL.
"""

import os
import json
from sqlalchemy.orm import Session
from models import NewsItem
from langdetect import detect, LangDetectException
from groq import Groq
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def process_pending_translations(db: Session, item_ids: List[int] = None) -> int:
    """
    Process pending translations for news items.
    
    Args:
        db: Database session
        item_ids: Optional list of specific item IDs to process. If None, processes all pending.
    
    Returns:
        int: Number of items translated
    """
    # Select items where title_es IS NULL
    query = db.query(NewsItem).filter(NewsItem.title_es == None)
    
    if item_ids:
        query = query.filter(NewsItem.id.in_(item_ids))
    
    pending_items = query.limit(10).all()  # Process in batches of 10
    
    if not pending_items:
        logger.info("[TRANSLATOR] No pending translations")
        return 0
    
    logger.info(f"[TRANSLATOR] Found {len(pending_items)} pending items for translation")
    
    # Initialize Groq client
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("API_KEY")
    model = os.getenv("MODEL", "llama-3.1-8b-instant")
    
    if not api_key:
        logger.error("[TRANSLATOR] GROQ_API_KEY not found in environment")
        return 0
    
    client = Groq(api_key=api_key)
    translated_count = 0
    
    for item in pending_items:
        try:
            # Step A: Detect language (if not already detected)
            if not item.language or item.language == "unknown":
                text_sample = f"{item.title} {item.content_snippet or ''}".strip()
                try:
                    item.language = detect(text_sample)
                except LangDetectException:
                    item.language = "unknown"
                    logger.warning(f"[TRANSLATOR] Could not detect language for item {item.id}")
            
            # Step B: Translation logic
            if item.language == 'es':
                # Already in Spanish, just copy
                item.title_es = item.title
                item.content_es = item.content_snippet
                logger.info(f"[TRANSLATOR] Item {item.id} already in Spanish, copied directly")
            else:
                # Translate using Groq
                prompt = f"""Translate the following news title and summary to Spanish. Maintain a neutral journalistic tone. Return ONLY a JSON object with this exact format:
{{
  "title": "translated title in Spanish",
  "content": "translated summary in Spanish"
}}

Title: {item.title}
Summary: {item.content_snippet or 'No summary available'}"""

                try:
                    response = client.chat.completions.create(
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a professional translator. Return ONLY valid JSON."
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
                    
                    item.title_es = result.get("title", item.title)
                    item.content_es = result.get("content", item.content_snippet)
                    
                    logger.info(f"[TRANSLATOR] Translated item {item.id} from {item.language} to Spanish")
                    
                except Exception as e:
                    logger.error(f"[TRANSLATOR] Groq translation failed for item {item.id}: {e}")
                    # Fallback: use original text
                    item.title_es = item.title
                    item.content_es = item.content_snippet
            
            translated_count += 1
            
        except Exception as e:
            logger.error(f"[TRANSLATOR] Error processing item {item.id}: {e}")
            # Set to original to avoid reprocessing
            item.title_es = item.title
            item.content_es = item.content_snippet
    
    db.commit()
    logger.info(f"[TRANSLATOR] Completed {translated_count} translations")
    return translated_count
