from qdrant_client import QdrantClient #bibliothèque Python pour parler à Qdrant.
from qdrant_client.models import (
    Distance, VectorParams, HnswConfigDiff
)
from app.core.config import settings

# Instance unique du client Qdrant
# Connexion à Qdrant (tourne dans Docker)
client = QdrantClient(url=settings.QDRANT_URL)
#Rôle : Se connecte à Qdrant et crée les "tiroirs" qui stockent les vecteurs. 
# Le Gestionnaire de Collections

# Noms des collections
COLLECTIONS = {
    "technical_manuals": "Manuels techniques PDF",
    "repair_procedures": "Procédures de réparation SAV",
    "faq_knowledge_base": "Questions fréquentes",
    "sav_history": "Historique tickets résolus",
    "technical_schemas": "Schémas éclatés techniques",
}

VECTOR_SIZE = 384 # Dimension des embeddings Google


def create_collections():
    """Crée toutes les collections Qdrant si elles n'existent pas."""
    # Récupère les collections existantes
    existing = [c.name for c in client.get_collections().collections]

    for collection_name in COLLECTIONS:
        if collection_name not in existing:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=VECTOR_SIZE,
                    distance=Distance.COSINE,# Distance cosinus pour mesurer la similarité entre vecteurs.
                    #la plus faible distance cosinus est 0 (vecteurs identiques) et la plus grande est 2 (vecteurs opposés)
                    
                ),
                # algorithme qui organise les vecteurs pour les retrouver rapidement (comme un index dans PostgreSQL).
                hnsw_config=HnswConfigDiff(
                    m=16,
                    ef_construct=200,
                ),
            )
            print(f"✓ Collection créée : {collection_name}")
        else:
            print(f"→ Collection existante : {collection_name}")


def get_qdrant_client() -> QdrantClient:
    return client