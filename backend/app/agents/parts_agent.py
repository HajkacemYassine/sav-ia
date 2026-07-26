from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.spare_part import SparePart
from app.models.product_spare_part import ProductSparePart
from uuid import UUID


async def get_recommended_parts(
    db: AsyncSession,
    product_id: str,
    parts_references: list[str],
) -> list[dict]:
    """
    Cherche les pièces compatibles avec le produit.
    Priorise les pièces mentionnées dans le diagnostic.
    """
    try:
        # 1. Chercher toutes les pièces du produit
        result = await db.execute(
            select(SparePart)
            .join(ProductSparePart, ProductSparePart.spare_part_id == SparePart.id)
            .where(ProductSparePart.product_id == UUID(product_id))
        )
        product_parts = result.scalars().all()

        recommendations = []
        for part in product_parts:

            # Score de pertinence
            relevance = 0.5
            if any(ref.lower() in part.reference.lower() for ref in parts_references):
                relevance = 0.95
            elif any(ref.lower() in part.name.lower() for ref in parts_references):
                relevance = 0.8

            recommendations.append({
                "part_id": str(part.id),
                "reference": part.reference,
                "name": part.name,
                "price": float(part.price),
                "in_stock": part.stock_quantity > 0,
                "stock_quantity": part.stock_quantity,
                "relevance_score": relevance,
            })

        # Trier par pertinence
        recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
        return recommendations[:5]

    except Exception:
        return []