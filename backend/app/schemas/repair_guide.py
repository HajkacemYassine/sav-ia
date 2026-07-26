from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class RepairGuideCreate(BaseModel):
    client_id: UUID
    product_id: UUID
    summary: str = Field(min_length=5, max_length=1000)
    repair_steps: list[str] = Field(min_length=1)
    safety_warnings: list[str] = []
    conversation_history: Optional[list[dict]] = None


class RepairGuideResponse(BaseModel):
    id: UUID
    guide_number: str
    client_id: UUID
    product_id: UUID
    summary: str
    repair_steps: list[str]
    safety_warnings: list[str]
    conversation_history: Optional[list] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RepairGuideSummary(BaseModel):
    id: UUID
    guide_number: str
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True
