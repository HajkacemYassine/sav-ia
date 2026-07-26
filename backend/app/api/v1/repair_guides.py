from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.repair_guide import (
    RepairGuideCreate,
    RepairGuideResponse,
    RepairGuideSummary,
)
from app.services import repair_guide_service

router = APIRouter(prefix="/repair-guides", tags=["Guides de réparation"])


@router.post("/", response_model=RepairGuideResponse, status_code=201)
async def create_repair_guide(
    data: RepairGuideCreate,
    db: AsyncSession = Depends(get_db),
):
    """Créer un guide de réparation self-service."""
    guide = await repair_guide_service.create_repair_guide(db, data)
    return guide


@router.get("/", response_model=list[RepairGuideSummary])
async def list_client_guides(
    client_id: UUID,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Lister les guides de réparation d'un client."""
    return await repair_guide_service.get_client_guides(
        db, client_id=client_id, skip=skip, limit=limit
    )


@router.get("/{guide_id}", response_model=RepairGuideResponse)
async def get_repair_guide(
    guide_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Récupérer le détail d'un guide de réparation."""
    guide = await repair_guide_service.get_repair_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guide non trouvé")
    return guide
