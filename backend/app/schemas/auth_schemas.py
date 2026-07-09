from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.models import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.WILDLIFE_RESEARCHER


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
