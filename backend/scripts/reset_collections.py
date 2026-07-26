import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.qdrant_client import get_qdrant_client, COLLECTIONS

client = get_qdrant_client()

print("🗑️ Suppression des anciennes collections...")
for collection in COLLECTIONS:
    try:
        client.delete_collection(collection)
        print(f"  ✓ Supprimé : {collection}")
    except:
        print(f"  → Pas trouvé : {collection}")

print("\n✅ Collections supprimées — relance FastAPI pour les recréer.")