from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class UniverseBase(BaseModel):
    name: str
    description: Optional[str] = None


class UniverseCreate(UniverseBase):
    pass


class UniverseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    collaborators: Optional[List[str]] = None


class UniverseInDB(UniverseBase):
    id: str
    user_id: str
    collaborators: List[str] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class Universe(UniverseInDB):
    pass