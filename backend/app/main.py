from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import tickets, clients, products, spare_parts, invoices, technicians, admin, part_orders, repair_guides, auth
from app.rag.qdrant_client import create_collections
from app.api.v1 import ai
from fastapi.staticfiles import StaticFiles
import os



os.makedirs("data/product_schemas", exist_ok=True)
app = FastAPI(
    title=settings.APP_NAME,
    description="Plateforme intelligente d'assistance SAV basée sur l'IA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.mount("/static/schemas", StaticFiles(directory="data/product_schemas"), name="schemas")
@app.on_event("startup")
async def startup_event():
    """Créer les collections Qdrant au démarrage."""
    print("🚀 Initialisation des collections Qdrant...")
    create_collections()
    print("✅ Collections prêtes !")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(tickets.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(spare_parts.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(technicians.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(part_orders.router, prefix="/api/v1")
app.include_router(repair_guides.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "SAV-IA API is running 🚀"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
    }