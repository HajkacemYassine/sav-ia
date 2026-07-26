import asyncio
from unicodedata import category

from app.rag.qdrant_client import get_qdrant_client
from app.rag.embedder import embed_query
from app.rag.reranker import rerank
from qdrant_client.models import Filter, FieldCondition, MatchValue


#fonction pour chercher des chunks dans Qdrant en fonction d'une requête textuelle.
#  Elle convertit la requête en vecteur, applique un filtre optionnel par produit,
#  et retourne les meilleurs résultats.
async def search(query: str,collection_name: str = "technical_manuals",product_id: str = None,top_k: int = 5,) -> list[dict]:
    """
    Recherche sémantique dans Qdrant.
    Retourne les top_k chunks les plus pertinents.
    """
    client = get_qdrant_client()

    #  1. Convertir la requête en vecteur
    query_vector = await embed_query(query)

    # 2. Filtre optionnel par produit
    search_filter = None
    if product_id:
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="product_id",
                    match=MatchValue(value=product_id)
                )
            ]
        )

    # 3. Chercher dans Qdrant
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=search_filter,
        limit=top_k,
        with_payload=True,
    )

    # 4. Formater et retourner
    return [
        {
            "text": hit.payload.get("text", ""),
            "score": round(hit.score, 4),
            "collection": collection_name,
            "page_number": hit.payload.get("page_number"),
            "product_id": hit.payload.get("product_id"),
            "source_file": hit.payload.get("source_file"),
        }
        for hit in results
    ]

#fonction pour chercher dans toutes les collections Qdrant et retourner les meilleurs résultats.
async def search_all_collections(
    query: str,
    product_id: str = None,
    top_k: int = 5,
) -> list[dict]:
    """Recherche en parallèle dans toutes les collections et retourne les meilleurs résultats."""
    collections = ["technical_manuals", "repair_procedures", "faq", "sav_history"]

    async def _safe_search(collection: str) -> list[dict]:
        try:
            return await search(query=query, collection_name=collection, product_id=product_id, top_k=20)
        except Exception:
            return []

    results_per_collection = await asyncio.gather(*[_safe_search(c) for c in collections])
    all_results = [r for results in results_per_collection for r in results]
    all_results.sort(key=lambda x: x["score"], reverse=True)
    return rerank(query=query, results=all_results, top_k=top_k)
