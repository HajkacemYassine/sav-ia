import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.client import Client
from app.models.invoice import Invoice
from app.schemas.client import ClientCreate


async def get_clients(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20
) -> list[Client]:
    result = await db.execute(
        select(Client).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def get_client(db: AsyncSession, client_id: uuid.UUID) -> Client | None:
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    return result.scalar_one_or_none()


async def get_client_by_email(db: AsyncSession, email: str) -> Client | None:
    result = await db.execute(
        select(Client).where(Client.email == email)
    )
    return result.scalar_one_or_none()


async def get_client_by_invoice_number(db: AsyncSession, invoice_number: str) -> Client | None:
    result = await db.execute(
        select(Client).join(Invoice).where(Invoice.invoice_number == invoice_number)
    )
    return result.scalar_one_or_none()


async def create_client(db: AsyncSession, data: ClientCreate) -> Client:
    client = Client(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        address=data.address,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client