from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class ClientCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class ClientResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


class ClientSummary(BaseModel):
    id: UUID
    full_name: str
    email: str

    class Config:
        from_attributes = True