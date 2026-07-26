from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.schemas.client import ClientCreate, ClientResponse, ClientSummary
from app.schemas.ticket import TicketSummary
from app.services import client_service, ticket_service
from app.models.invoice import Invoice
from app.models.invoice_product import InvoiceProduct
from app.models.product import Product


class ClientLookupRequest(BaseModel):
    email: EmailStr | None = None
    invoice_number: str | None = None


router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("/lookup", response_model=ClientResponse)
async def lookup_client(
    data: ClientLookupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rechercher un client par e-mail ou numéro de facture."""
    if not data.email and not data.invoice_number:
        raise HTTPException(status_code=400, detail="email ou invoice_number requis")

    client = None
    if data.email:
        client = await client_service.get_client_by_email(db, data.email)
    if not client and data.invoice_number:
        client = await client_service.get_client_by_invoice_number(db, data.invoice_number)

    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client


@router.get("/", response_model=list[ClientResponse])
async def list_clients(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Lister tous les clients"""
    return await client_service.get_clients(db, skip=skip, limit=limit)


@router.post("/", response_model=ClientResponse, status_code=201)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db)
):
    """Créer un nouveau client"""
    return await client_service.create_client(db, data)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Récupérer le détail d'un client"""
    client = await client_service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client


@router.get("/{client_id}/invoices")
async def get_client_invoices(
    client_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Invoice)
        .where(Invoice.client_id == client_id)
        .options(selectinload(Invoice.invoice_products).selectinload(InvoiceProduct.product))
        .order_by(Invoice.purchase_date.desc())
    )
    invoices = result.scalars().all()
    return [
        {
            "id": str(inv.id),
            "invoice_number": inv.invoice_number,
            "purchase_date": str(inv.purchase_date),
            "warranty_end_date": str(inv.warranty_end_date),
            "products": [
                {
                    "id": str(ip.product.id),
                    "brand": ip.product.brand,
                    "model": ip.product.model,
                    "category": ip.product.category,
                }
                for ip in inv.invoice_products if ip.product
            ],
        }
        for inv in invoices
    ]


@router.get("/{client_id}/tickets", response_model=list[TicketSummary])
async def get_client_tickets(
    client_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Récupérer tous les tickets d'un client"""
    return await ticket_service.get_tickets(db, client_id=client_id)