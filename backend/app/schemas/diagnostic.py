from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ProbableCause(BaseModel):
    cause: str
    probability: float


class Solution(BaseModel):
    step: int
    action: str


class DiagnosticResponse(BaseModel):
    ticket_id: UUID
    probable_causes: List[ProbableCause]
    solutions: List[Solution]
    spare_parts_needed: List[str]
    severity: str
    is_repairable: bool
    confidence_score: float
    technician_notes: Optional[str] = None
    processing_time_ms: int = 0