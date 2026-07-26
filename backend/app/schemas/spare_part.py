from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from decimal import Decimal


class SparePartResponse(BaseModel):
    id: UUID
    reference: str
    name: str
    price: Decimal
    stock_quantity: int
    supplier_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class SparePartUpdate(BaseModel):
    stock_quantity: int


class SparePartRecommendation(BaseModel):
    part_id: UUID
    reference: str
    name: str
    price: Decimal
    in_stock: bool
    stock_quantity: int
    relevance_score: float = 0.0