from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr


class UserModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    email: Optional[EmailStr] = None
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    preferences: dict = Field(default_factory=dict)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "johndoe@example.com",
                "password_hash": "hashed_password",
                "created_at": "2023-01-01T00:00:00",
                "preferences": {"default_llm": "deepseek-chat", "theme": "dark"}
            }
        }