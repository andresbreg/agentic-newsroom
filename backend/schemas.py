from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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

class TagBase(BaseModel):
    name: str
    color: str = "blue"
    description: Optional[str] = None

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
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
    source: Optional[SourceResponse] = None
    created_at: datetime
    ai_score: Optional[int] = None
    ai_explanation: Optional[str] = None
    ai_category: Optional[str] = None
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True

class NewsItemStatusUpdate(BaseModel):
    status: str

class AgentConfigBase(BaseModel):
    key: str
    value: str

class AgentConfigCreate(AgentConfigBase):
    pass

class AgentConfigResponse(AgentConfigBase):
    class Config:
        from_attributes = True

class BatchIdRequest(BaseModel):
    ids: List[int]

class AIConfigSettings(BaseModel):
    api_key: Optional[str] = None
    system_prompt: Optional[str] = None

class InterestTopicBase(BaseModel):
    subject: str
    scope: str
    keywords: str
    exclusions: Optional[str] = None
    relevance_level: str
    context_tags: Optional[str] = None

class InterestTopicCreate(InterestTopicBase):
    pass

class InterestTopicResponse(InterestTopicBase):
    id: int

    class Config:
        from_attributes = True


