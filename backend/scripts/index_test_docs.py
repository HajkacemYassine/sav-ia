import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.qdrant_client import get_qdrant_client
from app.rag.embedder import embed_text
from qdrant_client.models import PointStruct
import hashlib
import uuid


def make_id(text: str) -> str:
    hash_val = hashlib.md5(text.encode()).hexdigest()
    return str(uuid.UUID(hash_val))


def chunk_text(text: str, chunk_size: int = 200) -> list[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - 20):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


async def index_file(filepath: str, collection: str):
    client = get_qdrant_client()

    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = chunk_text(text)
    points = []

    for i, chunk in enumerate(chunks):
        print(f"  → Embedding chunk {i+1}/{len(chunks)}...")
        vector = await embed_text(chunk)
        points.append(PointStruct(
            id=make_id(chunk),
            vector=vector,
            payload={
                "text": chunk,
                "source_file": filepath,
                "chunk_index": i,
            }
        ))

    client.upsert(collection_name=collection, points=points)
    print(f"✅ {len(points)} chunks indexés dans '{collection}'")


async def main():
    print("🚀 Indexation des documents de test...\n")
    await index_file("data/docs/manuel_laveinge.txt", "technical_manuals")
    await index_file("data/docs/faq.txt", "faq")
    print("\n✅ Indexation terminée !")


if __name__ == "__main__":
    asyncio.run(main())