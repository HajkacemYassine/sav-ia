import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.orchestrator import run_diagnostic


async def main():
    print("🤖 Test des Agents IA\n")

    descriptions = [
        "Mon lave-linge Samsung perd de l'eau sous la porte depuis ce matin",
        "Mon frigo ne refroidit plus, il fait un bruit bizarre",
        "Ma machine à laver ne démarre plus du tout",
    ]

    for desc in descriptions:
        print(f"\n{'='*60}")
        print(f"Description : {desc}")
        print('='*60)

        result = await run_diagnostic(
            description=desc,
            product_id=None,
            db=None,
        )

        print(f"\n📊 Résultat :")
        print(f"  Produit détecté : {result['extracted_entities'].get('product_type')}")
        print(f"  Sévérité : {result['severity']}")
        print(f"  Réparable : {result['is_repairable']}")
        print(f"  Confiance : {result['confidence_score']}")
        print(f"  Causes probables :")
        for cause in result['probable_causes']:
            print(f"    - {cause['cause']} ({cause['probability']*100:.0f}%)")
        print(f"  Solutions :")
        for sol in result['solutions']:
            print(f"    {sol['step']}. {sol['action']}")
        print(f"  Temps : {result['processing_time_ms']}ms")


if __name__ == "__main__":
    asyncio.run(main())