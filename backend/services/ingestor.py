"""
Ingestor Service - RSS Feed Processing

Handles raw RSS feed ingestion without translation.
Extracts: title, link, date, content (cascade: content > summary > description)
Saves to: title and content_snippet columns
"""

import feedparser
from sqlalchemy.orm import Session
from models import Source, NewsItem
from datetime import datetime, timedelta, timezone
from langdetect import detect
from bs4 import BeautifulSoup
import re
from typing import Tuple, List


def clean_html(html_content: str) -> str:
    """Remove HTML tags and clean whitespace from content."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    text = soup.get_text(separator=" ")
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def process_feeds(db: Session) -> Tuple[int, List[int]]:
    """
    Process all active RSS feeds and ingest new items.
    
    Returns:
        Tuple[int, List[int]]: (count of new items, list of new item IDs)
    """
    sources = db.query(Source).filter(Source.type == 'RSS', Source.active == True).all()
    new_items_count = 0
    new_item_ids = []
    
    # Filter: 24h freshness
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=1)
    print(f"[INGESTOR] Starting RSS scan. Freshness cutoff: {cutoff_date}")
    
    for source in sources:
        try:
            url = source.config.get('url')
            if not url:
                continue
                
            feed = feedparser.parse(url)
            
            for entry in feed.entries:
                link = entry.get('link')
                if not link:
                    continue
                    
                # Check if exists
                existing = db.query(NewsItem).filter(NewsItem.url == link).first()
                if existing:
                    continue
                
                # Freshness Check
                item_date = datetime.now(timezone.utc)
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    item_date = datetime(*entry.published_parsed[:6]).replace(tzinfo=timezone.utc)
                
                if item_date < cutoff_date:
                    print(f"[INGESTOR] Skipping old article: {entry.get('title', 'No Title')} ({item_date})")
                    continue

                # Parse date to ISO format
                published_iso = item_date.isoformat()
                
                # Extract title
                title = entry.get('title', 'Sin título')
                
                # Content Extraction Logic (cascade: content > summary > description)
                content_raw = ""
                if hasattr(entry, 'content') and entry.content:
                    content_raw = entry.content[0].value
                elif hasattr(entry, 'summary_detail') and entry.summary_detail:
                    content_raw = entry.summary_detail.value
                elif hasattr(entry, 'summary'):
                    content_raw = entry.summary
                else:
                    content_raw = entry.get('description', '')
                
                content_snippet = clean_html(content_raw)
                
                if not content_snippet:
                    print(f"[INGESTOR] No content found for: {title}")

                # Detect language for future translation
                text_sample = f"{title} {content_snippet}".strip()
                detected_lang = "unknown"
                if text_sample:
                    try:
                        detected_lang = detect(text_sample)
                    except:
                        detected_lang = "unknown"

                # Create new item (no translation yet)
                new_item = NewsItem(
                    source_id=source.id,
                    title=title,
                    url=link,
                    published_date=published_iso,
                    status="DISCOVERED",
                    language=detected_lang,
                    content_snippet=content_snippet
                )
                db.add(new_item)
                db.flush()  # Get ID
                new_item_ids.append(new_item.id)
                new_items_count += 1
                
        except Exception as e:
            print(f"[INGESTOR] Error scanning source {source.name if hasattr(source, 'name') else 'unknown'}: {e}")
            
    db.commit()
    print(f"[INGESTOR] Processed {new_items_count} new items")
    return new_items_count, new_item_ids
