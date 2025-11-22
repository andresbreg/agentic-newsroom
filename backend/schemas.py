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
