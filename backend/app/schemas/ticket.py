from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum


class TicketStatus(str, Enum):
    open = "open"
    self_service = "self_service"
    assigned = "assigned"
    in_progress = "in_progress"
    waiting_parts = "waiting_parts"
    resolved = "resolved"
    closed = "closed"
    cancelled = "cancelled"


class TicketPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class TicketCreate(BaseModel):
    client_id: UUID
    product_id: UUID
    invoice_id: Optional[UUID] = None
    description_raw: str = Field(min_length=20, max_length=2000)


class TicketDescriptionUpdate(BaseModel):
    description_raw: str = Field(min_length=20, max_length=2000)


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketAssign(BaseModel):
    technician_id: UUID


class TicketClose(BaseModel):
    resolution_notes: str = Field(min_length=10)


class TicketResponse(BaseModel):
    id: UUID
    ticket_number: str
    status: TicketStatus
    priority: TicketPriority
    client_id: UUID
    product_id: UUID
    invoice_id: Optional[UUID] = None
    assigned_technician_id: Optional[UUID] = None
    description_raw: str
    ai_diagnosis: Optional[dict] = None
    conversation_history: Optional[list] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TicketSummary(BaseModel):
    id: UUID
    ticket_number: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime

    class Config:
        from_attributes = True