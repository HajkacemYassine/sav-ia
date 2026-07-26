from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal, get_db
from app.core.security import get_current_user, require_role
from app.schemas.ticket import (
    TicketAssign,
    TicketClose,
    TicketCreate,
    TicketDescriptionUpdate,
    TicketResponse,
    TicketStatusUpdate,
    TicketSummary,
)
from app.services import ticket_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/tickets", tags=["Tickets SAV"])


async def launch_diagnostic(ticket_id: UUID):
    """Lance le diagnostic IA en arriere-plan avec sa propre session DB."""
    async with AsyncSessionLocal() as db:
        try:
            print(f"\nDiagnostic background pour ticket {ticket_id}")
            await ai_service.diagnose(ticket_id=ticket_id, db=db)
        except Exception as e:
            await db.rollback()
            print(f"Erreur diagnostic background : {e}")


@router.post("/", response_model=TicketResponse, status_code=201)
async def create_ticket(
    data: TicketCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("client", "admin")),
):
    """
    Creer un ticket SAV.
    Le diagnostic IA se lance automatiquement en arriere-plan.
    """
    ticket = await ticket_service.create_ticket(db, data)

    background_tasks.add_task(
        launch_diagnostic,
        ticket_id=ticket.id,
    )

    print(f"Ticket cree : {ticket.ticket_number} - Diagnostic IA en cours...")
    return ticket


@router.get("/", response_model=list[TicketSummary])
async def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    client_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("client", "technician", "admin")),
):
    """Lister les tickets avec filtres optionnels."""
    return await ticket_service.get_tickets(
        db,
        status=status,
        priority=priority,
        client_id=client_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("client", "technician", "admin")),
):
    """Recuperer le detail complet d'un ticket avec son diagnostic."""
    ticket = await ticket_service.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouve")
    return ticket


@router.patch("/{ticket_id}/description", response_model=TicketResponse)
async def update_description(
    ticket_id: UUID,
    data: TicketDescriptionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Modifier la description d'un ticket (client uniquement)."""
    ticket = await ticket_service.update_ticket_description(db, ticket_id, data)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    return ticket


@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_status(
    ticket_id: UUID,
    data: TicketStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("technician", "admin")),
):
    """Changer le statut d'un ticket."""
    ticket = await ticket_service.update_ticket_status(db, ticket_id, data)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouve")
    return ticket


@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(
    ticket_id: UUID,
    data: TicketAssign,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("technician", "admin")),
):
    """Assigner un technicien a un ticket."""
    ticket = await ticket_service.assign_ticket(db, ticket_id, data.technician_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouve")
    return ticket


@router.post("/{ticket_id}/close", response_model=TicketResponse)
async def close_ticket(
    ticket_id: UUID,
    data: TicketClose,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("technician", "admin")),
):
    """Cloturer un ticket avec notes d'intervention."""
    ticket = await ticket_service.close_ticket(db, ticket_id, data)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouve")
    return ticket


@router.post("/{ticket_id}/escalate", response_model=TicketResponse)
async def escalate_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Escalader un ticket self_service vers un technicien.
    Utilisé quand le client n'a pas réussi à résoudre la panne seul.
    """
    ticket = await ticket_service.escalate_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    return ticket
