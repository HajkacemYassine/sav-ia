import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.product import Product
from app.models.product_spare_part import ProductSparePart
from app.models.spare_part import SparePart


async def create_product(db: AsyncSession, data: dict) -> Product:
    product = Product(**data)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def get_products(
    db: AsyncSession,
    brand: str = None,
    category: str = None,
    skip: int = 0,
    limit: int = 20,
) -> list[Product]:
    query = select(Product)
    if brand:
        query = query.where(Product.brand.ilike(f"%{brand}%"))
    if category:
        query = query.where(Product.category.ilike(f"%{category}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product | None:
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    return result.scalar_one_or_none()


async def get_product_spare_parts(
    db: AsyncSession,
    product_id: uuid.UUID
) -> list[SparePart]:
    result = await db.execute(
        select(SparePart)
        .join(ProductSparePart, ProductSparePart.spare_part_id == SparePart.id)
        .where(ProductSparePart.product_id == product_id)
    )
    return result.scalars().all()