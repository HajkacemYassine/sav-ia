from sentence_transformers import SentenceTransformer #sentence-transformers bibliothèque pour l'apprentissage de représentations vectorielles de phrases et de textes. Elle fournit des modèles pré-entraînés pour convertir du texte en vecteurs numériques, facilitant ainsi la recherche sémantique, le clustering et d'autres tâches de traitement du langage naturel.

# # Charge le modèle IA localement sur ton PC
model = SentenceTransformer("all-MiniLM-L6-v2")
#un modèle plus petit et rapide pour convertir de texte en vecteurs. Il est basé sur la famille MiniLM et est optimisé pour les tâches de recherche sémantique et de clustering.


async def embed_text(text: str) -> list[float]:
     # Convertit le texte en 384 nombres
    """Convertit un texte en vecteur localement."""
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


async def embed_query(query: str) -> list[float]:
    # Même chose mais pour une recherche
    """Convertit une requête en vecteur localement."""
    embedding = model.encode(query, normalize_embeddings=True)
    return embedding.tolist()