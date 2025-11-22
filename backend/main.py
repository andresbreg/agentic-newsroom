from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import scraper
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

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
    return {
        "active_news": 0,
        "sources_count": sources_count,
        "pending_alerts": 0
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
    count = scraper.scan_rss_sources(db)
    return {"new_items": count}

@app.get("/api/news/discovered", response_model=List[schemas.NewsItemResponse])
def get_discovered_news(db: Session = Depends(get_db)):
    return db.query(models.NewsItem).filter(models.NewsItem.status == "DISCOVERED").all()

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
    return db.query(models.NewsItem).filter(models.NewsItem.status == "APPROVED").all()
