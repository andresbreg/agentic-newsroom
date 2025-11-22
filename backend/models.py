from sqlalchemy import Boolean, Column, Integer, String
from database import Base

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
    source_id = Column(Integer, index=True)
    title = Column(String, index=True)
    url = Column(String, unique=True, index=True)
    published_date = Column(String)
    status = Column(String, default="DISCOVERED")  # DISCOVERED, APPROVED, REJECTED
