import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.qdrant_client import get_qdrant_client
from app.rag.embedder import embed_query


async def main():
    print("🔍 Test de recherche RAG...\n")

    client = get_qdrant_client()
    queries = [
        "lave-linge fuit sous la porte",
        "compresseur fait du bruit",
        "pièce détachée joint étanchéité",
    ]

    for query in queries:
        print(f"Query : '{query}'")

        # Vectoriser la requête
        vector = await embed_query(query)

        # Chercher dans technical_manuals
        results = client.query_points(
            collection_name="technical_manuals",
            query=vector,
            limit=3,
            with_payload=True,
        ).points

        if not results:
            print("  → Aucun résultat\n")
        else:
            for r in results:
                print(f"  Score: {round(r.score, 4)} | {r.payload.get('text', '')[:100]}...")
        print()


if __name__ == "__main__":
    asyncio.run(main())