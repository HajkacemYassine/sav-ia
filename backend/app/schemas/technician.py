from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class TechnicianCreate(BaseModel):
    full_name: str
    email: EmailStr
    speciality: Optional[str] = None
    is_available: bool = True


class TechnicianAvailabilityUpdate(BaseModel):
    is_available: bool


class TechnicianResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    speciality: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True