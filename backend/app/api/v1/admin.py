import os
import uuid
from collections import Counter
from datetime import date
from typing import Optional

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.core.security import require_role
from app.models.part_order import PartOrder
from app.models.sav_ticket import SavTicket
from app.services.indexing_service import index_document
import shutil
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.product import Product

SCHEMA_DIR = "data/product_schemas"

router = APIRouter(prefix="/admin", tags=["Administration"])

# Dossier temporaire pour les uploads
UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Stockage simple des jobs en mémoire
jobs = {}


class AdminLookupRequest(BaseModel):
    email: EmailStr


class AdminLookupResponse(BaseModel):
    id: str
    email: EmailStr
    label: str


class IndexingJobResponse(BaseModel):
    job_id: str
    status: str
    message: str


class CountStat(BaseModel):
    key: str
    count: int


class AdminStatsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    critical_tickets: int
    resolved_tickets: int
    resolution_rate: float
    waiting_parts: int
    out_of_warranty: int
    average_repair_cost: float
    repairable_tickets: int
    non_repairable_tickets: int
    part_orders_count: int
    status_counts: list[CountStat]
    priority_counts: list[CountStat]


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Retourne les statistiques globales des tickets et des commandes de pièces."""
    query = select(SavTicket).options(selectinload(SavTicket.invoice), selectinload(SavTicket.product))
    result = await db.execute(query)
    tickets = result.scalars().all()

    today = date.today()
    waiting_parts = 0
    out_of_warranty = 0
    estimated_costs: list[float] = []
    repairable_count = 0
    non_repairable_count = 0

    for ticket in tickets:
        if ticket.status == "waiting_parts":
            waiting_parts += 1

        if ticket.invoice and ticket.invoice.warranty_end_date < today:
            out_of_warranty += 1

        cost = None
        diagnosis = ticket.ai_diagnosis or {}
        if isinstance(diagnosis, dict):
            estimated = diagnosis.get("estimated_repair_cost")
            if isinstance(estimated, (int, float)):
                cost = float(estimated)

            repairable = diagnosis.get("is_repairable")
            if repairable is True:
                repairable_count += 1
            elif repairable is False:
                non_repairable_count += 1

        if cost is None and ticket.product and ticket.product.avg_repair_cost is not None:
            cost = float(ticket.product.avg_repair_cost)

        if cost is not None:
            estimated_costs.append(cost)

    status_counts = Counter([ticket.status for ticket in tickets])
    priority_counts = Counter([ticket.priority for ticket in tickets])
    total_part_orders = await db.scalar(select(func.count()).select_from(PartOrder))

    average_repair_cost = round(sum(estimated_costs) / len(estimated_costs), 2) if estimated_costs else 0.0
    resolved_tickets = sum(status_counts.get(status, 0) for status in ["resolved", "closed"])
    total_tickets = len(tickets)
    resolution_rate = round((resolved_tickets / total_tickets) * 100, 2) if total_tickets else 0.0

    return AdminStatsResponse(
        total_tickets=total_tickets,
        open_tickets=status_counts.get("open", 0),
        critical_tickets=priority_counts.get("critical", 0),
        resolved_tickets=resolved_tickets,
        resolution_rate=resolution_rate,
        waiting_parts=waiting_parts,
        out_of_warranty=out_of_warranty,
        average_repair_cost=average_repair_cost,
        repairable_tickets=repairable_count,
        non_repairable_tickets=non_repairable_count,
        part_orders_count=total_part_orders or 0,
        status_counts=[CountStat(key=status, count=status_counts.get(status, 0)) for status in ["self_service", "open", "assigned", "in_progress", "waiting_parts", "resolved", "closed", "cancelled"]],
        priority_counts=[CountStat(key=priority, count=priority_counts.get(priority, 0)) for priority in ["low", "medium", "high", "critical"]],
    )


async def run_indexing_job(
    job_id: str,
    file_path: str,
    collection_name: str,
    product_id: str = None,
    brand: str = None,
    model: str = None,
    category: str = None,
):
    """Tâche background : indexe le document et met à jour le statut du job."""
    try:
        jobs[job_id] = {"status": "processing", "result": None}

        result = await index_document(
            file_path=file_path,
            collection_name=collection_name,
            product_id=product_id,
            brand=brand,
            model=model,
            category=category,
        )

        jobs[job_id] = {"status": "completed", "result": result}

    except Exception as e:
        jobs[job_id] = {"status": "failed", "error": str(e)}
    finally:
        # Supprimer le fichier temporaire
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/documents/upload", response_model=IndexingJobResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    collection_name: str = "technical_manuals",
    product_id: Optional[str] = None,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(require_role("admin")),
):
    """
    Upload un document PDF/TXT et l'indexe dans Qdrant.
    L'indexation se fait en arrière-plan.
    Retourne un job_id pour suivre l'avancement.
    """
    # Vérifier le type de fichier
    if not file.filename.endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF et TXT sont acceptés"
        )

    # Sauvegarder le fichier temporairement
    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Initialiser le job
    jobs[job_id] = {"status": "queued", "result": None}

    # Lancer l'indexation en arrière-plan
    background_tasks.add_task(
        run_indexing_job,
        job_id=job_id,
        file_path=file_path,
        collection_name=collection_name,
        product_id=product_id,
        brand=brand,
        model=model,
        category=category,
    )

    return IndexingJobResponse(
        job_id=job_id,
        status="queued",
        message=f"Indexation de '{file.filename}' démarrée en arrière-plan"
    )


@router.get("/documents/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Vérifier le statut d'un job d'indexation."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job non trouvé")
    return {"job_id": job_id, **jobs[job_id]}


@router.get("/documents/collections")
async def list_collections():
    """Lister les collections Qdrant et leur nombre de documents."""
    from app.rag.qdrant_client import get_qdrant_client
    client = get_qdrant_client()
    collections = client.get_collections().collections
    return {
        "collections": [
            {
                "name": c.name,
            }
            for c in collections
        ]
    }


@router.post("/lookup", response_model=AdminLookupResponse)
async def lookup_admin(data: AdminLookupRequest):
    """Rechercher une administration par e-mail autorisé."""
    allowed_emails = {email.strip().lower() for email in settings.ADMIN_EMAILS}
    if data.email.strip().lower() not in allowed_emails:
        raise HTTPException(status_code=404, detail="Administrateur non trouvé")

    return {
        "id": data.email.strip().lower(),
        "email": data.email,
        "label": "Administration",
    }
@router.post("/products/{product_id}/schema-image")
async def upload_product_schema(
    product_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload une vraie image de schéma technique pour un produit précis."""
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PNG/JPG sont acceptés")

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    ext = file.filename.split(".")[-1]
    filename = f"{product_id}.{ext}"
    filepath = os.path.join(SCHEMA_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    product.schema_image_url = f"/static/schemas/{filename}"
    await db.commit()
    await db.refresh(product)

    return {"status": "success", "schema_image_url": product.schema_image_url}