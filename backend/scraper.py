import feedparser
from sqlalchemy.orm import Session
from models import Source, NewsItem
from datetime import datetime
from langdetect import detect

def scan_rss_sources(db: Session):
    sources = db.query(Source).filter(Source.type == 'RSS', Source.active == True).all()
    new_items_count = 0
    new_item_ids = []
    
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
                if not existing:
                    # Parse date to ISO format for correct sorting
                    published_iso = datetime.now().isoformat()
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        published_iso = datetime(*entry.published_parsed[:6]).isoformat()
                    elif entry.get('published'):
                        # Fallback if published_parsed fails but string exists
                        try:
                            # Simple cleanup for common formats if needed, 
                            # but published_parsed is usually very reliable with feedparser
                            pass 
                        except:
                            pass
                    
                    # Language detection
                    title = entry.get('title', 'Sin título')
                    summary = entry.get('summary', '')
                    text_sample = f"{title} {summary}".strip()
                    
                    detected_lang = "unknown"
                    if text_sample:
                        try:
                            detected_lang = detect(text_sample)
                        except:
                            detected_lang = "unknown"

                    new_item = NewsItem(
                        source_id=source.id,
                        title=title,
                        url=link,
                        published_date=published_iso,
                        status="DISCOVERED",
                        language=detected_lang
                    )
                    db.add(new_item)
                    db.flush() # Get ID
                    new_item_ids.append(new_item.id)
                    new_items_count += 1
        except Exception as e:
            print(f"Error scanning source {source.name if hasattr(source, 'name') else 'unknown'}: {e}")
            
    db.commit()
    return new_items_count, new_item_ids
