from pydantic import BaseModel
from datetime import date


class WarrantyStatus(BaseModel):
    is_valid: bool
    warranty_end_date: date
    days_remaining: int
    message: str