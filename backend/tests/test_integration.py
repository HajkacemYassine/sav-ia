import asyncio
import sys
import os
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000/api/v1"

# IDs connus depuis ta base de données
CLIENT_ID = "0d8c71f6-132f-4674-94ed-fe4cd5c6e89a"


async def test_full_scenario():
    async with httpx.AsyncClient(timeout=60.0) as client:

        print("=" * 60)
        print("🧪 TEST INTÉGRATION BOUT-EN-BOUT")
        print("=" * 60)

        # ── Étape 1 : Vérifier le client ───────────────
        print("\n[1/8] Récupération du client...")
        response = await client.get(f"{BASE_URL}/clients/{CLIENT_ID}")
        print(f"   Status : {response.status_code}")
        assert response.status_code == 200, f"Erreur : {response.text}"
        client_data = response.json()
        print(f"   ✅ Client : {client_data['full_name']}")

        # ── Étape 2 : Récupérer un produit ─────────────
        print("\n[2/8] Récupération d'un produit...")
        response = await client.get(f"{BASE_URL}/products/")
        print(f"   Status : {response.status_code}")
        assert response.status_code == 200, f"Erreur : {response.text}"
        products = response.json()
        assert len(products) > 0, "Aucun produit en base"
        product_id = products[0]["id"]
        print(f"   ✅ Produit : {products[0]['brand']} {products[0]['model']}")

        # ── Étape 3 : Créer un ticket ───────────────────
        print("\n[3/8] Création du ticket...")
        response = await client.post(f"{BASE_URL}/tickets/", json={
            "client_id": CLIENT_ID,
            "product_id": product_id,
            "description_raw": "Mon appareil perd de l'eau sous la porte depuis ce matin, il fait aussi un bruit bizarre",
        })
        print(f"   Status : {response.status_code}")
        assert response.status_code == 201, f"Erreur : {response.text}"
        ticket = response.json()
        ticket_id = ticket["id"]
        print(f"   ✅ Ticket créé : {ticket['ticket_number']}")
        print(f"   Statut initial : {ticket['status']}")

        # ── Étape 4 : Attendre le diagnostic ───────────
        print("\n[4/8] Attente du diagnostic IA (20 secondes)...")
        await asyncio.sleep(20)

        # ── Étape 5 : Vérifier le diagnostic ───────────
        print("\n[5/8] Vérification du diagnostic...")
        response = await client.get(f"{BASE_URL}/tickets/{ticket_id}")
        assert response.status_code == 200
        ticket_detail = response.json()

        if ticket_detail.get("ai_diagnosis"):
            diagnosis = ticket_detail["ai_diagnosis"]
            print(f"   ✅ Diagnostic présent !")
            print(f"   Confiance : {diagnosis.get('confidence_score')}")
            print(f"   Sévérité : {diagnosis.get('severity')}")
            print(f"   Causes : {len(diagnosis.get('probable_causes', []))}")
            print(f"   Priorité ticket : {ticket_detail.get('priority')}")
        else:
            print("   ⚠️ Diagnostic pas encore disponible")

        # ── Étape 6 : Changer statut ───────────────────
        print("\n[6/8] Mise à jour statut → in_progress...")
        response = await client.patch(
            f"{BASE_URL}/tickets/{ticket_id}/status",
            json={"status": "in_progress"}
        )
        assert response.status_code == 200
        print(f"   ✅ Statut : {response.json()['status']}")

        # ── Étape 7 : Clôturer le ticket ───────────────
        print("\n[7/8] Clôture du ticket...")
        response = await client.post(
            f"{BASE_URL}/tickets/{ticket_id}/close",
            json={"resolution_notes": "Joint de porte remplacé. Référence JNT-001. Réparation effectuée en 30 minutes. Client satisfait."}
        )
        assert response.status_code == 200
        closed_ticket = response.json()
        print(f"   ✅ Ticket clôturé : {closed_ticket['status']}")

        # ── Étape 8 : Vérifier sav_history ─────────────
        print("\n[8/8] Vérification indexation sav_history...")
        await asyncio.sleep(3)

        from app.rag.qdrant_client import get_qdrant_client
        qdrant = get_qdrant_client()
        collection_info = qdrant.get_collection("sav_history")
        points_count = collection_info.points_count
        print(f"   ✅ sav_history contient {points_count} points")

        print("\n" + "=" * 60)
        print("✅ TEST INTÉGRATION RÉUSSI !")
        print("=" * 60)
        print(f"\nRésumé :")
        print(f"  Ticket créé    : {ticket['ticket_number']}")
        print(f"  Diagnostic IA  : {'✅' if ticket_detail.get('ai_diagnosis') else '⚠️ en attente'}")
        print(f"  Ticket clôturé : ✅")
        print(f"  sav_history    : {points_count} points")


if __name__ == "__main__":
    asyncio.run(test_full_scenario())