import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.spare_part import SparePart


async def get_spare_parts(
    db: AsyncSession,
    in_stock: bool = None,
    skip: int = 0,
    limit: int = 20,
) -> list[SparePart]:
    query = select(SparePart)
    if in_stock is True:
        query = query.where(SparePart.stock_quantity > 0)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_spare_part(
    db: AsyncSession,
    part_id: uuid.UUID
) -> SparePart | None:
    result = await db.execute(
        select(SparePart).where(SparePart.id == part_id)
    )
    return result.scalar_one_or_none()


async def update_stock(
    db: AsyncSession,
    part_id: uuid.UUID,
    quantity: int
) -> SparePart | None:
    part = await get_spare_part(db, part_id)
    if not part:
        return None
    part.stock_quantity = quantity
    await db.commit()
    await db.refresh(part)
    return part