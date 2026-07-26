from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class PartOrderCreate(BaseModel):
    ticket_id: UUID
    spare_part_id: UUID
    technician_id: Optional[UUID] = None
    quantity: int = 1


class PartOrderResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    spare_part_id: UUID
    technician_id: Optional[UUID] = None
    quantity: int
    status: str
    ordered_at: datetime
    part_reference: Optional[str] = None
    part_name: Optional[str] = None

    class Config:
        from_attributes = True