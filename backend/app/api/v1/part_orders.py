from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.db.session import get_db
from app.schemas.part_order import PartOrderCreate, PartOrderResponse
from app.models.part_order import PartOrder
from app.models.spare_part import SparePart

router = APIRouter(prefix="/part-orders", tags=["Commandes Pièces"])


@router.post("/", response_model=PartOrderResponse, status_code=201)
async def create_part_order(
    data: PartOrderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Commander une pièce détachée pour un ticket — décrémente le stock si disponible."""
    part_result = await db.execute(
        select(SparePart).where(SparePart.id == data.spare_part_id)
    )
    part = part_result.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=404, detail="Pièce non trouvée")

    order = PartOrder(
        ticket_id=data.ticket_id,
        spare_part_id=data.spare_part_id,
        technician_id=data.technician_id,
        quantity=data.quantity,
    )
    db.add(order)

    if part.stock_quantity >= data.quantity:
        part.stock_quantity -= data.quantity

    await db.commit()
    await db.refresh(order)

    return PartOrderResponse(
        id=order.id,
        ticket_id=order.ticket_id,
        spare_part_id=order.spare_part_id,
        technician_id=order.technician_id,
        quantity=order.quantity,
        status=order.status,
        ordered_at=order.ordered_at,
        part_reference=part.reference,
        part_name=part.name,
    )


@router.get("/ticket/{ticket_id}", response_model=list[PartOrderResponse])
async def get_ticket_orders(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Lister les commandes de pièces déjà passées pour un ticket."""
    result = await db.execute(
        select(PartOrder, SparePart)
        .join(SparePart, SparePart.id == PartOrder.spare_part_id)
        .where(PartOrder.ticket_id == ticket_id)
        .order_by(PartOrder.ordered_at.desc())
    )
    rows = result.all()
    return [
        PartOrderResponse(
            id=order.id,
            ticket_id=order.ticket_id,
            spare_part_id=order.spare_part_id,
            technician_id=order.technician_id,
            quantity=order.quantity,
            status=order.status,
            ordered_at=order.ordered_at,
            part_reference=part.reference,
            part_name=part.name,
        )
        for order, part in rows
    ]