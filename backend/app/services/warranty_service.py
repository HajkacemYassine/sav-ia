import uuid
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.invoice import Invoice
from app.schemas.warranty import WarrantyStatus


async def check_warranty(
    db: AsyncSession,
    invoice_id: uuid.UUID
) -> WarrantyStatus | None:
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        return None

    today = date.today()
    days_remaining = (invoice.warranty_end_date - today).days
    is_valid = days_remaining > 0

    return WarrantyStatus(
        is_valid=is_valid,
        warranty_end_date=invoice.warranty_end_date,
        days_remaining=max(0, days_remaining),
        message="Garantie valide ✓" if is_valid else "Garantie expirée ✗"
    )