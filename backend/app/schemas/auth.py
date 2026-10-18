from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    display_name: str
    is_admin: bool


class UserProfileResponse(BaseModel):
    id: str
    email: str
    display_name: str
    is_admin: bool

    class Config:
        from_attributes = True
