from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.db.session import get_db
from app.core.security import require_role
from app.schemas.technician import (
    TechnicianResponse,
    TechnicianCreate,
    TechnicianAvailabilityUpdate,
)
from app.schemas.ticket import TicketSummary
from app.models.technician import Technician


class TechnicianLookupRequest(BaseModel):
    email: EmailStr


router = APIRouter(prefix="/technicians", tags=["Techniciens"])


@router.get("/", response_model=list[TechnicianResponse])
async def list_technicians(
    available: bool = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("technician", "admin")),
):
    """Lister les techniciens"""
    query = select(Technician)
    if available is not None:
        query = query.where(Technician.is_available == available)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TechnicianResponse, status_code=201)
async def create_technician(
    data: TechnicianCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Créer un nouveau technicien"""
    existing = await db.execute(
        select(Technician).where(Technician.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Un technicien avec cet email existe déjà")

    technician = Technician(
        full_name=data.full_name,
        email=data.email,
        speciality=data.speciality,
        is_available=data.is_available,
    )
    # Diagnostic logging for debugging persistence issues
    try:
        print(f"[tech-create] Received create request: full_name={data.full_name} email={data.email} speciality={data.speciality} is_available={data.is_available}")
        db.add(technician)
        await db.commit()
        await db.refresh(technician)
        print(f"[tech-create] Commit OK, created technician id={technician.id}")
        return technician
    except Exception as e:
        # Rollback will be handled by dependency, but log here as well
        print(f"[tech-create] Error while creating technician: {e}")
        raise


@router.post("/lookup", response_model=TechnicianResponse)
async def lookup_technician(
    data: TechnicianLookupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rechercher un technicien par email."""
    result = await db.execute(
        select(Technician).where(Technician.email == data.email)
    )
    technician = result.scalar_one_or_none()
    if not technician:
        raise HTTPException(status_code=404, detail="Technicien non trouvé")
    return technician


@router.patch("/{technician_id}/availability", response_model=TechnicianResponse)
async def update_availability(
    technician_id: UUID,
    data: TechnicianAvailabilityUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Changer la disponibilité d'un technicien"""
    result = await db.execute(
        select(Technician).where(Technician.id == technician_id)
    )
    technician = result.scalar_one_or_none()
    if not technician:
        raise HTTPException(status_code=404, detail="Technicien non trouvé")

    technician.is_available = data.is_available
    await db.commit()
    await db.refresh(technician)
    return technician


@router.delete("/{technician_id}", status_code=204)
async def delete_technician(
    technician_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Supprimer un technicien"""
    result = await db.execute(
        select(Technician).where(Technician.id == technician_id)
    )
    technician = result.scalar_one_or_none()
    if not technician:
        raise HTTPException(status_code=404, detail="Technicien non trouvé")

    await db.delete(technician)
    await db.commit()


@router.get("/{technician_id}/tickets", response_model=list[TicketSummary])
async def get_technician_tickets(
    technician_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Tickets assignés à un technicien"""
    from app.models.sav_ticket import SavTicket
    result = await db.execute(
        select(SavTicket).where(
            SavTicket.assigned_technician_id == technician_id
        )
    )
    return result.scalars().all()