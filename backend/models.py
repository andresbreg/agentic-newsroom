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
