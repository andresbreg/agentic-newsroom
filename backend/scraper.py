import feedparser
from sqlalchemy.orm import Session
from models import Source, NewsItem
from datetime import datetime

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
                # Check if exists
                existing = db.query(NewsItem).filter(NewsItem.url == entry.link).first()
                if not existing:
                    published = entry.get('published', datetime.now().isoformat())
                    new_item = NewsItem(
                        source_id=source.id,
                        title=entry.title,
                        url=entry.link,
                        published_date=published,
                        status="DISCOVERED"
                    )
                    db.add(new_item)
                    db.flush() # Get ID
                    new_item_ids.append(new_item.id)
                    new_items_count += 1
        except Exception as e:
            print(f"Error scanning source {source.url}: {e}")
            
    db.commit()
    return new_items_count, new_item_ids
