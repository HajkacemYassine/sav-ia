import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.indexer import (
    index_faq,
    index_sav_history,
    index_repair_procedure,
    index_technical_schema,
)


async def main():
    print("🚀 Peuplement des collections Qdrant...\n")

    # ── FAQ ─────────────────────────────────────────
    print("📚 Indexation FAQ...")
    faqs = [
        {
            "question": "Mon lave-linge perd de l'eau, que faire ?",
            "answer": "Vérifier le joint de porte, la vanne d'alimentation et les tuyaux. Le joint usé est la cause la plus fréquente.",
            "category": "lave-linge",
        },
        {
            "question": "Mon appareil est sous garantie, la réparation est-elle gratuite ?",
            "answer": "Oui, si votre appareil est sous garantie constructeur, la réparation pièces et main d'œuvre est prise en charge.",
            "category": "garantie",
        },
        {
            "question": "Mon frigo ne refroidit plus du tout ?",
            "answer": "Causes possibles : compresseur défaillant, gaz réfrigérant manquant, thermostat cassé. Contacter un technicien.",
            "category": "réfrigérateur",
        },
        {
            "question": "Combien de temps dure une réparation SAV ?",
            "answer": "En moyenne 3 à 5 jours ouvrés selon la disponibilité des pièces détachées.",
            "category": "général",
        },
        {
            "question": "Ma machine à laver fait un bruit anormal pendant l'essorage ?",
            "answer": "Cela indique souvent des roulements usés ou un tambour déséquilibré. Vérifier aussi si du linge est coincé.",
            "category": "lave-linge",
        },
    ]
    for faq in faqs:
        await index_faq(**faq)

    # ── Procédures de réparation ─────────────────────
    print("\n🔧 Indexation procédures...")
    procedures = [
        {
            "text": "Remplacement joint de porte lave-linge : 1. Débrancher l'appareil. 2. Retirer le joint usé en tirant doucement. 3. Nettoyer le logement. 4. Installer le nouveau joint en commençant par le haut. 5. Vérifier l'étanchéité.",
            "product_id": None,
            "category": "lave-linge",
            "step_number": 1,
            "difficulty": "easy",
        },
        {
            "text": "Remplacement courroie lave-linge : 1. Débrancher et vider le tambour. 2. Retirer le panneau arrière. 3. Dégager l'ancienne courroie du moteur et de la poulie. 4. Installer la nouvelle courroie. 5. Remonter et tester.",
            "product_id": None,
            "category": "lave-linge",
            "step_number": 1,
            "difficulty": "medium",
        },
        {
            "text": "Diagnostic compresseur réfrigérateur : 1. Vérifier tension alimentation. 2. Tester le relais de démarrage. 3. Mesurer résistance bobines compresseur (valeur normale 5-30 ohms). 4. Si résistance infinie = compresseur HS.",
            "product_id": None,
            "category": "réfrigérateur",
            "step_number": 1,
            "difficulty": "hard",
        },
    ]
    for proc in procedures:
        await index_repair_procedure(**proc)

    # ── Historique SAV ───────────────────────────────
    print("\n📋 Indexation historique SAV...")
    history = [
        {
            "product_id": None,
            "symptoms": ["fuite d'eau", "eau sous la porte"],
            "solution": "Remplacement du joint de porte référence JNT-001. Réparation effectuée en 30 minutes.",
        },
        {
            "product_id": None,
            "symptoms": ["tambour bloqué", "ne tourne plus"],
            "solution": "Courroie cassée remplacée. Référence CRR-045. Client satisfait.",
        },
        {
            "product_id": None,
            "symptoms": ["bruit anormal", "vibrations fortes"],
            "solution": "Roulements avant usés remplacés. Références RLT-012. Durée intervention 2h.",
        },
        {
            "product_id": None,
            "symptoms": ["ne démarre pas", "aucune réaction"],
            "solution": "Carte électronique défaillante remplacée. Référence PCB-S90. Mise à jour firmware effectuée.",
        },
    ]
    for hist in history:
        await index_sav_history(**hist)

    # ── Schémas techniques ───────────────────────────
    print("\n📐 Indexation schémas techniques...")
    schemas = [
        {
            "description": "Joint de porte : pièce en caoutchouc circulaire assurant l'étanchéité entre la porte et le tambour. Situé à l'avant de l'appareil. Se dégrade avec le temps et les lavages répétés.",
            "product_id": None,
            "component": "joint_porte",
        },
        {
            "description": "Courroie de transmission : relie le moteur au tambour. Pièce en caoutchouc nervuré. Se casse après 5-8 ans d'utilisation intensive.",
            "product_id": None,
            "component": "courroie",
        },
        {
            "description": "Carte électronique principale : cerveau de l'appareil. Contrôle tous les programmes et capteurs. Sensible aux surtensions électriques.",
            "product_id": None,
            "component": "carte_electronique",
        },
    ]
    for schema in schemas:
        await index_technical_schema(**schema)

    print("\n✅ Toutes les collections sont peuplées !")
    print("\n📊 Résumé :")
    print(f"  - faq_knowledge_base    : {len(faqs)} entrées")
    print(f"  - repair_procedures     : {len(procedures)} procédures")
    print(f"  - sav_history           : {len(history)} cas résolus")
    print(f"  - technical_schemas     : {len(schemas)} schémas")


if __name__ == "__main__":
    asyncio.run(main())