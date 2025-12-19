from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List

import models
import schemas
import scraper
from database import SessionLocal, engine
from ai_agent import AIAgent
from sqlalchemy import text

models.Base.metadata.create_all(bind=engine)

# Simple migration to ensure new columns exist (for prototype robustness)
def run_migrations():
    db = SessionLocal()
    try:
        # Check if column exists by trying to select it. If error, add it.
        # SQLite doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN directly in all versions/drivers nicely,
        # so we try-except.
        try:
            db.execute(text("SELECT ai_score FROM news_items LIMIT 1"))
        except Exception:
            db.rollback()
            db.execute(text("ALTER TABLE news_items ADD COLUMN ai_score INTEGER"))
            db.execute(text("ALTER TABLE news_items ADD COLUMN ai_explanation VARCHAR"))
            db.execute(text("ALTER TABLE news_items ADD COLUMN ai_category VARCHAR"))
            db.commit()
    except Exception as e:
        print(f"Migration warning: {e}")
    finally:
        db.close()

run_migrations()

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/status")
async def get_status():
    return {"status": "online", "system_active": True}

@app.get("/api/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    sources_count = db.query(models.Source).count()
    active_news_count = db.query(models.NewsItem).filter(models.NewsItem.status == "DISCOVERED").count()
    return {
        "active_news": active_news_count,
        "sources_count": sources_count
    }

@app.get("/api/sources", response_model=List[schemas.SourceResponse])
def read_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sources = db.query(models.Source).offset(skip).limit(limit).all()
    return sources

@app.post("/api/sources", response_model=schemas.SourceResponse)
def create_source(source: schemas.SourceCreate, db: Session = Depends(get_db)):
    db_source = models.Source(**source.dict())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

@app.put("/api/sources/{source_id}", response_model=schemas.SourceResponse)
def update_source(source_id: int, source: schemas.SourceCreate, db: Session = Depends(get_db)):
    db_source = db.query(models.Source).filter(models.Source.id == source_id).first()
    if db_source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    
    for key, value in source.dict().items():
        setattr(db_source, key, value)
    
    db.commit()
    db.refresh(db_source)
    return db_source

@app.delete("/api/sources/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    db_source = db.query(models.Source).filter(models.Source.id == source_id).first()
    if db_source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(db_source)
    db.commit()
    return {"ok": True}

@app.get("/")
async def root():
    return {"message": "Agentic Newsroom Backend is running"}

@app.post("/api/scan")
def scan_sources(db: Session = Depends(get_db)):
    count, new_ids = scraper.scan_rss_sources(db)
    return {"new_items": count, "new_item_ids": new_ids}

@app.get("/api/news/discovered", response_model=List[schemas.NewsItemResponse])
def get_discovered_news(db: Session = Depends(get_db)):
    return db.query(models.NewsItem).options(joinedload(models.NewsItem.source)).filter(models.NewsItem.status == "DISCOVERED").order_by(models.NewsItem.id.desc()).all()

@app.put("/api/news/{news_id}/status", response_model=schemas.NewsItemResponse)
def update_news_status(news_id: int, status_update: schemas.NewsItemStatusUpdate, db: Session = Depends(get_db)):
    item = db.query(models.NewsItem).filter(models.NewsItem.id == news_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    item.status = status_update.status
    db.commit()
    db.refresh(item)
    return item

@app.get("/api/news/approved", response_model=List[schemas.NewsItemResponse])
def get_approved_news(db: Session = Depends(get_db)):
    return db.query(models.NewsItem).options(joinedload(models.NewsItem.source)).filter(models.NewsItem.status == "APPROVED").order_by(models.NewsItem.id.desc()).all()

@app.get("/api/news/rejected", response_model=List[schemas.NewsItemResponse])
def get_rejected_news(db: Session = Depends(get_db)):
    return db.query(models.NewsItem).options(joinedload(models.NewsItem.source)).filter(models.NewsItem.status == "REJECTED").order_by(models.NewsItem.id.desc()).all()

@app.delete("/api/news/{news_id}")
def delete_news_item(news_id: int, db: Session = Depends(get_db)):
    item = db.query(models.NewsItem).filter(models.NewsItem.id == news_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="News item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

@app.delete("/api/news/rejected/all")
def empty_trash(db: Session = Depends(get_db)):
    db.query(models.NewsItem).filter(models.NewsItem.status == "REJECTED").delete(synchronize_session=False)
    db.commit()
    return {"ok": True}

@app.put("/api/news/{news_id}/restore", response_model=schemas.NewsItemResponse)
def restore_news_item(news_id: int, db: Session = Depends(get_db)):
    item = db.query(models.NewsItem).filter(models.NewsItem.id == news_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="News item not found")
    
    item.status = "DISCOVERED"
    db.commit()
    db.refresh(item)
    return item

@app.post("/api/news/batch/delete")
def batch_delete_news(request: schemas.BatchIdRequest, db: Session = Depends(get_db)):
    db.query(models.NewsItem).filter(models.NewsItem.id.in_(request.ids)).delete(synchronize_session=False)
    db.commit()
    return {"ok": True, "count": len(request.ids)}

@app.post("/api/news/batch/restore")
def batch_restore_news(request: schemas.BatchIdRequest, db: Session = Depends(get_db)):
    db.query(models.NewsItem).filter(models.NewsItem.id.in_(request.ids)).update({models.NewsItem.status: "DISCOVERED"}, synchronize_session=False)
    db.commit()
    return {"ok": True, "count": len(request.ids)}

@app.get("/api/config", response_model=schemas.AIConfigSettings)
def get_config(db: Session = Depends(get_db)):
    api_key_config = db.query(models.AgentConfig).filter(models.AgentConfig.key == "gemini_api_key").first()
    system_prompt_config = db.query(models.AgentConfig).filter(models.AgentConfig.key == "system_instructions").first()
    
    api_key = api_key_config.value if api_key_config else None
    system_prompt = system_prompt_config.value if system_prompt_config else None
    
    # Mask API Key
    if api_key and len(api_key) > 4:
        masked_key = api_key[:4] + "*" * (len(api_key) - 4)
    else:
        masked_key = api_key

    return schemas.AIConfigSettings(api_key=masked_key, system_prompt=system_prompt)

@app.post("/api/config", response_model=schemas.AIConfigSettings)
def update_config(config: schemas.AIConfigSettings, db: Session = Depends(get_db)):
    # Update API Key if provided
    if config.api_key:
        # Check if it's masked (don't update if it is)
        if not config.api_key.endswith("****"):
            db_key = db.query(models.AgentConfig).filter(models.AgentConfig.key == "gemini_api_key").first()
            if db_key:
                db_key.value = config.api_key
            else:
                db_key = models.AgentConfig(key="gemini_api_key", value=config.api_key)
                db.add(db_key)

    # Update System Prompt if provided
    if config.system_prompt is not None:
        db_prompt = db.query(models.AgentConfig).filter(models.AgentConfig.key == "system_instructions").first()
        if db_prompt:
            db_prompt.value = config.system_prompt
        else:
            db_prompt = models.AgentConfig(key="system_instructions", value=config.system_prompt)
            db.add(db_prompt)
    
    db.commit()
    
    # Return updated config (masked)
    # Return updated config (masked)
    return get_config(db)

# Interest Topic Endpoints

@app.get("/api/topics", response_model=List[schemas.InterestTopicResponse])
def read_topics(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    topics = db.query(models.InterestTopic).offset(skip).limit(limit).all()
    return topics

@app.post("/api/topics", response_model=schemas.InterestTopicResponse)
def create_topic(topic: schemas.InterestTopicCreate, db: Session = Depends(get_db)):
    db_topic = models.InterestTopic(**topic.dict())
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

@app.put("/api/topics/{topic_id}", response_model=schemas.InterestTopicResponse)
def update_topic(topic_id: int, topic: schemas.InterestTopicCreate, db: Session = Depends(get_db)):
    db_topic = db.query(models.InterestTopic).filter(models.InterestTopic.id == topic_id).first()
    if db_topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    for key, value in topic.dict().items():
        setattr(db_topic, key, value)
    
    db.commit()
    db.refresh(db_topic)
    return db_topic

    db.delete(db_topic)
    db.commit()
    return {"ok": True}

@app.post("/api/analyze")
def analyze_news(db: Session = Depends(get_db)):
    # Fetch pending items (DISCOVERED and no score yet)
    pending_items = db.query(models.NewsItem).filter(
        models.NewsItem.status == 'DISCOVERED',
        models.NewsItem.ai_score == None
    ).limit(5).all() # Batch size 20 to respect rate limits
    
    agent = AIAgent(db)
    count = agent.analyze_batch(pending_items)
    
    return {"analyzed_count": count}

# Tag Endpoints

@app.get("/api/tags", response_model=List[schemas.TagResponse])
def read_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tags = db.query(models.Tag).offset(skip).limit(limit).all()
    return tags

@app.post("/api/tags", response_model=schemas.TagResponse)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    db_tag = models.Tag(**tag.dict())
    try:
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/tags/{tag_id}", response_model=schemas.TagResponse)
def update_tag(tag_id: int, tag: schemas.TagCreate, db: Session = Depends(get_db)):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    for key, value in tag.dict().items():
        setattr(db_tag, key, value)
    
    try:
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/tags/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(db_tag)
    db.commit()
    return {"ok": True}

# Entity Endpoints

@app.get("/api/entities", response_model=List[schemas.EntityResponse])
def read_entities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    entities = db.query(models.Entity).options(joinedload(models.Entity.sources)).offset(skip).limit(limit).all()
    return entities

@app.post("/api/entities", response_model=schemas.EntityResponse)
def create_entity(entity: schemas.EntityCreate, db: Session = Depends(get_db)):
    db_entity = models.Entity(
        name=entity.name,
        type=entity.type,
        description=entity.description
    )
    
    if entity.source_ids:
        sources = db.query(models.Source).filter(models.Source.id.in_(entity.source_ids)).all()
        db_entity.sources = sources
    
    db.add(db_entity)
    try:
        db.commit()
        db.refresh(db_entity)
        return db_entity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/entities/{entity_id}", response_model=schemas.EntityResponse)
def update_entity(entity_id: int, entity: schemas.EntityCreate, db: Session = Depends(get_db)):
    db_entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
    if db_entity is None:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    db_entity.name = entity.name
    db_entity.type = entity.type
    db_entity.description = entity.description
    
    if entity.source_ids is not None:
        sources = db.query(models.Source).filter(models.Source.id.in_(entity.source_ids)).all()
        db_entity.sources = sources
    
    try:
        db.commit()
        db.refresh(db_entity)
        return db_entity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/entities/{entity_id}")
def delete_entity(entity_id: int, db: Session = Depends(get_db)):
    db_entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
    if db_entity is None:
        raise HTTPException(status_code=404, detail="Entity not found")
    db.delete(db_entity)
    db.commit()
    return {"ok": True}
