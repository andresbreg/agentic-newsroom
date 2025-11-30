from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

news_tags = Table('news_tags', Base.metadata,
    Column('news_id', Integer, ForeignKey('news_items.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    color = Column(String, default="blue")
    description = Column(String, nullable=True)

    news_items = relationship("NewsItem", secondary=news_tags, back_populates="tags")

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String, unique=True, index=True)
    type = Column(String)  # 'RSS' or 'HTML'
    pattern = Column(String, nullable=True)
    active = Column(Boolean, default=True)

class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), index=True)
    title = Column(String, index=True)
    url = Column(String, unique=True, index=True)
    published_date = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="DISCOVERED")  # DISCOVERED, APPROVED, REJECTED
    ai_score = Column(Integer, nullable=True)
    ai_explanation = Column(String, nullable=True)
    ai_category = Column(String, nullable=True)
    
    source = relationship("Source")
    tags = relationship("Tag", secondary=news_tags, back_populates="news_items")

class AgentConfig(Base):
    __tablename__ = "agent_config"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class InterestTopic(Base):
    __tablename__ = "interest_topics"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)  # Asunto
    scope = Column(String)  # Alcance
    keywords = Column(String)  # Comma-separated
    exclusions = Column(String)  # Comma-separated
    relevance_level = Column(String)  # High, Medium, Low
    context_tags = Column(String)  # Comma-separated tags
