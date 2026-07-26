import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.models.product import Product
from app.models.invoice import Invoice

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def main():
    async with AsyncSessionLocal() as session:

        # 1. Créer le produit "four"
        product = Product(
            brand="Bosch",
            model="HBA534BS0F",
            category="four",
            repairable=True,
            avg_repair_cost=90.0,
        )
        session.add(product)
        await session.flush()
        print(f"✓ Produit créé : {product.brand} {product.model} (id={product.id})")

        # 2. Prendre une facture existante et la faire pointer vers ce produit
        result = await session.execute(select(Invoice).limit(1))
        invoice = result.scalar_one_or_none()
        if not invoice:
            print("❌ Aucune facture trouvée — importe d'abord invoice_test_data.json")
            return

        invoice.product_id = product.id
        await session.commit()
        await session.refresh(invoice)

        print(f"✓ Facture {invoice.invoice_number} pointe maintenant vers le four")
        print(f"\n📋 Utilise ces IDs pour créer ton ticket :")
        print(f"   client_id  = {invoice.client_id}")
        print(f"   product_id = {product.id}")
        print(f"   invoice_id = {invoice.id}")


if __name__ == "__main__":
    asyncio.run(main())