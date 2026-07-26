from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # "client" | "technician"
    phone: Optional[str] = None
    address: Optional[str] = None
    speciality: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # "client" | "technician" | "admin"


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    label: str
    invoice_id: Optional[str] = None
