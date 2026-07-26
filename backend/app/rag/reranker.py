def rerank(
    query: str,
    results: list[dict],
    top_k: int = 5,
) -> list[dict]:
    """
    Re-classe les résultats RAG avec un score composite.

    Score composite = combinaison de :
    - Score sémantique Qdrant (cosine similarity)
    - Pertinence des mots-clés de la requête
    - Fraîcheur (sav_history plus récent = mieux)
    """
    query_words = set(query.lower().split())

    for result in results:
        text = result["text"].lower()
        text_words = set(text.split())

        # Score 1 : Sémantique (déjà calculé par Qdrant)
        semantic_score = result["score"]

        # Score 2 : Mots-clés en commun
        common_words = query_words.intersection(text_words)
        keyword_score = len(common_words) / max(len(query_words), 1)

        # Score 3 : Bonus selon la collection
        collection_bonus = {
            "repair_procedures": 0.1,  # Procédures = très utiles
            "sav_history": 0.08,       # Historique = utile
            "technical_manuals": 0.05, # Manuels = référence
            "faq": 0.02,               # FAQ = général
        }.get(result.get("collection", ""), 0)

        # Score composite final
        result["composite_score"] = (
            semantic_score * 0.7 +
            keyword_score * 0.2 +
            collection_bonus * 0.1
        )

    # Trier par score composite
    results.sort(key=lambda x: x["composite_score"], reverse=True)
    return results[:top_k]