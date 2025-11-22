from pydantic import BaseModel
from typing import Optional

class SourceBase(BaseModel):
    name: str
    url: str
    type: str
    pattern: Optional[str] = None
    active: bool = True

class SourceCreate(SourceBase):
    pass

class SourceResponse(SourceBase):
    id: int

    class Config:
        from_attributes = True

class NewsItemBase(BaseModel):
    title: str
    url: str
    published_date: Optional[str] = None
    status: str = "DISCOVERED"

class NewsItemCreate(NewsItemBase):
    source_id: int

class NewsItemResponse(NewsItemBase):
    id: int
    source_id: int

    class Config:
        from_attributes = True

class NewsItemStatusUpdate(BaseModel):
    status: str
