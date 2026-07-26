from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
from app.db.session import get_db
from app.schemas.spare_part import SparePartResponse, SparePartUpdate
from app.services import parts_service

router = APIRouter(prefix="/spare-parts", tags=["Pièces Détachées"])


@router.get("/", response_model=list[SparePartResponse])
async def list_spare_parts(
    in_stock: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Lister les pièces détachées"""
    return await parts_service.get_spare_parts(
        db, in_stock=in_stock, skip=skip, limit=limit
    )


@router.get("/{part_id}", response_model=SparePartResponse)
async def get_spare_part(
    part_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Détail d'une pièce"""
    part = await parts_service.get_spare_part(db, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Pièce non trouvée")
    return part


@router.patch("/{part_id}/stock", response_model=SparePartResponse)
async def update_stock(
    part_id: UUID,
    data: SparePartUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Mettre à jour le stock d'une pièce"""
    part = await parts_service.update_stock(db, part_id, data.stock_quantity)
    if not part:
        raise HTTPException(status_code=404, detail="Pièce non trouvée")
    return part