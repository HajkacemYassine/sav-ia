from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
from app.db.session import get_db
from app.schemas.product import ProductResponse, ProductCreate
from app.schemas.spare_part import SparePartResponse
from app.services import product_service

router = APIRouter(prefix="/products", tags=["Produits"])


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db)
):
    """Créer un nouveau produit"""
    return await product_service.create_product(db, payload.model_dump())


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    brand: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Lister les produits avec filtres"""
    return await product_service.get_products(
        db, brand=brand, category=category, skip=skip, limit=limit
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Détail d'un produit"""
    product = await product_service.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return product


@router.get("/{product_id}/spare-parts", response_model=list[SparePartResponse])
async def get_product_spare_parts(
    product_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Pièces détachées compatibles avec un produit"""
    return await product_service.get_product_spare_parts(db, product_id)