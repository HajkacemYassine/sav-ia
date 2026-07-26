import hashlib
import uuid
from datetime import datetime
from app.rag.qdrant_client import get_qdrant_client
from app.rag.chunker import chunk_pdf, chunk_text
from app.rag.embedder import embed_text
from qdrant_client.models import PointStruct


def make_id(text: str) -> str:
    """Génère un ID unique basé sur le contenu — évite les doublons."""
    hash_val = hashlib.md5(text.encode()).hexdigest()
    return str(uuid.UUID(hash_val))


async def index_technical_manual(
    pdf_path: str,
    product_id: str = None,
    brand: str = None,
    model: str = None,
):
    """Indexe un manuel technique PDF dans technical_manuals."""
    client = get_qdrant_client()
    chunks = chunk_pdf(pdf_path)
    points = []

    for i, chunk in enumerate(chunks):
        print(f"  → Embedding chunk {i+1}/{len(chunks)}...")
        vector = await embed_text(chunk["text"])
        points.append(PointStruct(
            id=make_id(chunk["text"]),
            vector=vector,
            payload={
                "product_id": product_id,
                "brand": brand,
                "model": model,
                "page_number": chunk["page_number"],
                "chunk_text": chunk["text"],
                "chunk_index": i,
            }
        ))

    client.upsert(collection_name="technical_manuals", points=points)
    print(f"✅ {len(points)} chunks → technical_manuals")
    return len(points)


async def index_repair_procedure(
    text: str,
    product_id: str,
    category: str,
    step_number: int = 1,
    difficulty: str = "medium",
):
    """Indexe une procédure de réparation dans repair_procedures."""
    client = get_qdrant_client()
    vector = await embed_text(text)

    client.upsert(
        collection_name="repair_procedures",
        points=[PointStruct(
            id=make_id(text),
            vector=vector,
            payload={
                "product_id": product_id,
                "category": category,
                "step_number": step_number,
                "difficulty": difficulty,
                "chunk_text": text,
            }
        )]
    )
    print(f"✅ Procédure indexée → repair_procedures")


async def index_faq(
    question: str,
    answer: str,
    category: str,
    language: str = "fr",
):
    """Indexe une entrée FAQ dans faq_knowledge_base."""
    client = get_qdrant_client()
    text = f"Question: {question}\nRéponse: {answer}"
    vector = await embed_text(text)

    client.upsert(
        collection_name="faq_knowledge_base",
        points=[PointStruct(
            id=make_id(text),
            vector=vector,
            payload={
                "category": category,
                "language": language,
                "question": question,
                "answer": answer,
                "chunk_text": text,
            }
        )]
    )
    print(f"✅ FAQ indexée → faq_knowledge_base")


async def index_sav_history(
    product_id: str,
    symptoms: list[str],
    solution: str,
    resolved_at: str = None,
):
    """Indexe un ticket résolu dans sav_history."""
    client = get_qdrant_client()
    text = f"Symptômes: {', '.join(symptoms)}\nSolution: {solution}"
    vector = await embed_text(text)

    client.upsert(
        collection_name="sav_history",
        points=[PointStruct(
            id=make_id(text),
            vector=vector,
            payload={
                "product_id": product_id,
                "symptoms": symptoms,
                "solution": solution,
                "resolved_at": resolved_at or datetime.utcnow().isoformat(),
                "chunk_text": text,
            }
        )]
    )
    print(f"✅ Historique indexé → sav_history")


async def index_technical_schema(
    description: str,
    product_id: str,
    component: str,
):
    """Indexe un schéma technique dans technical_schemas."""
    client = get_qdrant_client()
    vector = await embed_text(description)

    client.upsert(
        collection_name="technical_schemas",
        points=[PointStruct(
            id=make_id(description),
            vector=vector,
            payload={
                "product_id": product_id,
                "component": component,
                "description": description,
                "chunk_text": description,
            }
        )]
    )
    print(f"✅ Schéma indexé → technical_schemas")