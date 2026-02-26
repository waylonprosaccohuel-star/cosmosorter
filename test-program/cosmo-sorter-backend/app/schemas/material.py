from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class MaterialCategory(str, Enum):
    CHARACTER = "character"
    LOCATION = "location"
    ITEM = "item"
    EVENT = "event"
    CONCEPT = "concept"


class AttachmentSchema(BaseModel):
    file_name: str
    file_type: str
    oss_url: str


class AIMetadataSchema(BaseModel):
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    embedding: Optional[List[float]] = None


class MaterialBase(BaseModel):
    category: MaterialCategory
    content: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[AttachmentSchema] = Field(default_factory=list)
    ai_metadata: Optional[AIMetadataSchema] = None


class MaterialCreate(MaterialBase):
    universe_id: str


class MaterialUpdate(BaseModel):
    category: Optional[MaterialCategory] = None
    content: Optional[Dict[str, Any]] = None
    attachments: Optional[List[AttachmentSchema]] = None
    ai_metadata: Optional[AIMetadataSchema] = None


class MaterialInDB(MaterialBase):
    id: str
    user_id: str
    universe_id: str
    version: int = 1
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Material(MaterialInDB):
    pass


class MaterialListResponse(BaseModel):
    items: List[Material]
    total: int
    page: int
    page_size: int