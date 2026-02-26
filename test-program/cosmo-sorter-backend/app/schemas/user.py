from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# Properties to receive via API on update
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


# Properties stored in DB
class UserInDB(UserBase):
    id: str
    created_at: datetime
    password_hash: str

    class Config:
        from_attributes = True


# Properties to return via API
class User(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None