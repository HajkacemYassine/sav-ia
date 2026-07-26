import asyncio
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sav_ticket import SavTicket
from app.models.product import Product
from app.schemas.ticket import TicketCreate, TicketStatusUpdate, TicketClose, TicketDescriptionUpdate
from app.services import client_service
from app.services.notification_service import send_ticket_status_email


def generate_ticket_number() -> str:
    year = datetime.now().year
    unique = str(uuid.uuid4().int)[:5]
    return f"SAV-{year}-{unique}"


async def _get_client_email(db: AsyncSession, ticket: SavTicket) -> str | None:
    

    client = await client_service.get_client(db, ticket.client_id)
    return client.email if client else None


async def _send_notification_for_ticket(
    db: AsyncSession,
    ticket: SavTicket,
    status: str,
    summary: str,
) -> None:
    email = await _get_client_email(db, ticket)
    if not email:
        print(f"[notification] Aucun e-mail client trouvé pour ticket {ticket.ticket_number}")
        return

    await asyncio.to_thread(
        send_ticket_status_email,
        email,
        ticket.ticket_number,
        str(ticket.id),
        status,
        summary,
    )


async def create_ticket(db: AsyncSession, data: TicketCreate) -> SavTicket:
    ticket = SavTicket(
        ticket_number=generate_ticket_number(),
        client_id=data.client_id,
        product_id=data.product_id,
        invoice_id=data.invoice_id,
        description_raw=data.description_raw,
        status="open",
        priority="medium",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    await _send_notification_for_ticket(
        db,
        ticket,
        "open",
        "Votre dossier a bien été créé. Nous vous tiendrons informé de la suite de l’intervention.",
    )
    return ticket


async def get_ticket(db: AsyncSession, ticket_id: uuid.UUID) -> SavTicket | None:
    result = await db.execute(
        select(SavTicket).where(SavTicket.id == ticket_id)
    )
    return result.scalar_one_or_none()


async def get_tickets(
    db: AsyncSession,
    status: str = None,
    priority: str = None,
    client_id: uuid.UUID = None,
    skip: int = 0,
    limit: int = 20,
) -> list[SavTicket]:
    query = select(SavTicket)
    if status:
        query = query.where(SavTicket.status == status)
    if priority:
        query = query.where(SavTicket.priority == priority)
    if client_id:
        query = query.where(SavTicket.client_id == client_id)
    query = query.offset(skip).limit(limit).order_by(SavTicket.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def update_ticket_description(
    db: AsyncSession,
    ticket_id: uuid.UUID,
    data: TicketDescriptionUpdate,
) -> SavTicket | None:
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    ticket.description_raw = data.description_raw
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def update_ticket_status(
    db: AsyncSession,
    ticket_id: uuid.UUID,
    data: TicketStatusUpdate
) -> SavTicket | None:
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    ticket.status = data.status
    if data.status == "resolved":
        ticket.resolved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ticket)

    await _send_notification_for_ticket(
        db,
        ticket,
        data.status,
        f"Le statut du dossier a été mis à jour : {data.status}."
    )
    return ticket


async def assign_ticket(
    db: AsyncSession,
    ticket_id: uuid.UUID,
    technician_id: uuid.UUID
) -> SavTicket | None:
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    ticket.assigned_technician_id = technician_id
    ticket.status = "assigned"
    await db.commit()
    await db.refresh(ticket)

    await _send_notification_for_ticket(
        db,
        ticket,
        "assigned",
        "Un technicien a été assigné à votre dossier. Il interviendra bientôt."
    )
    return ticket

async def escalate_ticket(
    db: AsyncSession,
    ticket_id: uuid.UUID,
) -> SavTicket | None:
    """
    Escalade un ticket auto-résolu vers la file d'attente technicien.
    Utilisé quand le client n'a pas réussi à résoudre lui-même la panne.
    """
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    if ticket.status != "self_service":
        return None
    ticket.status = "open"
    await db.commit()
    await db.refresh(ticket)

    await _send_notification_for_ticket(
        db,
        ticket,
        "open",
        "Votre dossier a été transmis à un technicien. Il interviendra bientôt.",
    )
    return ticket

async def close_ticket(
    db: AsyncSession,
    ticket_id: uuid.UUID,
    data: TicketClose
) -> SavTicket | None:
    """
    Clôture un ticket et indexe automatiquement
    le cas résolu dans Qdrant sav_history.
    """
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None

    # Mettre à jour le ticket
    ticket.status = "closed"
    ticket.resolution_notes = data.resolution_notes
    ticket.resolved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ticket)

    # Indexer dans Qdrant sav_history
    try:
        from app.services.indexing_service import index_resolved_ticket

        # Extraire les symptômes du diagnostic IA
        symptoms = []
        if ticket.ai_diagnosis:
            entities = ticket.ai_diagnosis.get("extracted_entities", {})
            symptoms = entities.get("symptoms", [])

        if not symptoms:
            symptoms = [ticket.description_raw[:100]]

        await index_resolved_ticket(
            product_id=str(ticket.product_id) if ticket.product_id else None,
            symptoms=symptoms,
            solution=data.resolution_notes,
            resolved_at=ticket.resolved_at.isoformat(),
        )
        print(f"✅ Cas résolu indexé dans sav_history")

    except Exception as e:
        print(f"⚠️ Erreur indexation : {e}")

    await _send_notification_for_ticket(
        db,
        ticket,
        "closed",
        "Votre dossier est désormais clôturé et votre produit a été traité.",
    )

    return ticket