from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.schemas.warranty import WarrantyStatus
from app.services import warranty_service

router = APIRouter(prefix="/invoices", tags=["Factures"])


@router.get("/{invoice_id}/warranty-status", response_model=WarrantyStatus)
async def check_warranty(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Vérifier le statut de garantie d'une facture"""
    status = await warranty_service.check_warranty(db, invoice_id)
    if not status:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return status