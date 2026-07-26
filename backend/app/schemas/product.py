from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from decimal import Decimal


class ProductCreate(BaseModel):
    brand: str
    model: str
    category: str
    repairable: bool = True
    avg_repair_cost: Optional[Decimal] = None


class ProductResponse(BaseModel):
    id: UUID
    brand: str
    model: str
    category: str
    repairable: bool
    avg_repair_cost: Optional[Decimal] = None
    schema_image_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProductSummary(BaseModel):
    id: UUID
    brand: str
    model: str
    category: str

    class Config:
        from_attributes = True