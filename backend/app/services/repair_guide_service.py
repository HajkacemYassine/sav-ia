import uuid
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.repair_guide import RepairGuide
from app.schemas.repair_guide import RepairGuideCreate
from app.services import client_service
from app.services.notification_service import send_ticket_status_email


def generate_guide_number() -> str:
    year = datetime.now().year
    unique = str(uuid.uuid4().int)[:5]
    return f"REP-{year}-{unique}"


async def create_repair_guide(db: AsyncSession, data: RepairGuideCreate) -> RepairGuide:
    guide = RepairGuide(
        guide_number=generate_guide_number(),
        client_id=data.client_id,
        product_id=data.product_id,
        summary=data.summary,
        repair_steps=data.repair_steps,
        safety_warnings=data.safety_warnings,
        conversation_history=data.conversation_history,
    )
    db.add(guide)
    await db.commit()
    await db.refresh(guide)

    # Notification email
    client = await client_service.get_client(db, data.client_id)
    if client and client.email:
        await asyncio.to_thread(
            send_ticket_status_email,
            client.email,
            guide.guide_number,
            str(guide.id),
            "self_service",
            f"Votre guide de réparation {guide.guide_number} est disponible. "
            f"Suivez les étapes proposées par notre assistant.",
        )

    print(f"Guide de réparation créé : {guide.guide_number}")
    return guide


async def get_repair_guide(db: AsyncSession, guide_id: uuid.UUID) -> RepairGuide | None:
    result = await db.execute(
        select(RepairGuide).where(RepairGuide.id == guide_id)
    )
    return result.scalar_one_or_none()


async def get_client_guides(
    db: AsyncSession,
    client_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
) -> list[RepairGuide]:
    query = (
        select(RepairGuide)
        .where(RepairGuide.client_id == client_id)
        .order_by(RepairGuide.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()
