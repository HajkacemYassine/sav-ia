import os
import uuid
from app.rag.chunker import chunk_text
from app.rag.embedder import embed_text
from app.rag.qdrant_client import get_qdrant_client
from app.rag.indexer import index_sav_history
from qdrant_client.models import PointStruct
import hashlib


def make_id(text: str) -> str:
    hash_val = hashlib.md5(text.encode()).hexdigest()
    return str(uuid.UUID(hash_val))


async def index_document(
    file_path: str,
    collection_name: str,
    product_id: str = None,
    brand: str = None,
    model: str = None,
    category: str = None,
    document_type: str = "manual",
) -> dict:
    """Pipeline complet : Fichier → chunks → embeddings → Qdrant"""
    client = get_qdrant_client()

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    chunks = chunk_text(text, chunk_size=500, overlap=50)
    print(f"📄 {len(chunks)} chunks extraits")

    points = []
    for i, chunk in enumerate(chunks):
        vector = await embed_text(chunk)
        points.append(PointStruct(
            id=make_id(chunk),
            vector=vector,
            payload={
                "text": chunk,
                "chunk_index": i,
                "product_id": product_id,
                "brand": brand,
                "model": model,
                "category": category,
                "document_type": document_type,
                "source_file": os.path.basename(file_path),
            }
        ))

    client.upsert(collection_name=collection_name, points=points)
    print(f"✅ {len(points)} chunks indexés dans '{collection_name}'")

    return {
        "status": "success",
        "chunks_indexed": len(points),
        "collection": collection_name,
        "source_file": os.path.basename(file_path),
    }


async def index_resolved_ticket(
    product_id: str,
    symptoms: list[str],
    solution: str,
    resolved_at: str = None,
) -> None:
    """
    Indexe un ticket résolu dans Qdrant sav_history.
    Appelée automatiquement quand un ticket est clôturé.
    """
    try:
        await index_sav_history(
            product_id=product_id,
            symptoms=symptoms,
            solution=solution,
            resolved_at=resolved_at,
        )
        print(f"✅ Ticket résolu indexé dans sav_history")
    except Exception as e:
        print(f"⚠️ Erreur indexation sav_history : {e}")