import json
import asyncio
import sys
import os
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.db.base import Base
from app.models.client import Client
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.invoice import Invoice

# Chemin du fichier JSON
JSON_FILE = os.path.join(os.path.dirname(__file__), "invoice_test_data.json")

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


def parse_date(date_str: str) -> date:
    """Convertit une string date en objet date Python."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").date()
    except Exception:
        return None


def calc_warranty_end(issue_date_str: str, duration: int, unit: str) -> date:
    """Calcule la date de fin de garantie."""
    issue_date = parse_date(issue_date_str)
    if not issue_date or not duration:
        return None
    if unit == "YEARS":
        return issue_date.replace(year=issue_date.year + duration)
    elif unit == "MONTHS":
        month = issue_date.month + duration
        year = issue_date.year + month // 12
        month = month % 12 or 12
        return issue_date.replace(year=year, month=month)
    return issue_date


async def import_invoice(data: dict):
    invoice_data = data["invoice"]

    async with AsyncSessionLocal() as session:

        # ── 1. CLIENT ──────────────────────────────────────────────────
        customer = invoice_data["customer"]
        contact = customer.get("contact", {})
        addresses = customer.get("addresses", [])
        billing = next((a for a in addresses if a["type"] == "BILLING"), {})

        email = contact.get("email", f"{customer['reference']}@sav.local")
        full_name = f"{customer.get('firstName', '')} {customer.get('lastName', '')}".strip()
        address_str = f"{billing.get('address', '')}, {billing.get('city', '')} {billing.get('zipCode', '')}"

        # Dédup client par email (déjà UNIQUE en DB, et fiable ici)
        existing_client = await session.execute(
            select(Client).where(Client.email == email)
        )
        client = existing_client.scalar_one_or_none()

        if not client:
            client = Client(
                full_name=full_name or customer["reference"],
                email=email,
                phone=contact.get("phoneNumber") or contact.get("mobileNumber"),
                address=address_str,
            )
            session.add(client)
            await session.flush()
            print(f"  ✓ Client créé : {client.full_name}")
        else:
            print(f"  → Client existant : {client.full_name}")

        # ── 2. PRODUITS + FOURNISSEURS + FACTURES ──────────────────────
        issue_date = invoice_data.get("issueDate")

        for line in invoice_data.get("lines", []):
            product_data = line["product"]
            supplier_data = product_data.get("supplier", {})

            # ── Fournisseur ──
            # Dédup par external_code (le code métier du JSON), PAS par email :
            # plusieurs fournisseurs distincts partagent le même email générique
            # de test dans le JSON (ex: wecaretestit@adeo.com), donc dédupliquer
            # par email fusionnerait des fournisseurs différents par erreur.
            supplier_code = supplier_data.get("code")
            existing_supplier = await session.execute(
                select(Supplier).where(Supplier.external_code == supplier_code)
            )
            supplier = existing_supplier.scalar_one_or_none()

            if not supplier:
                supplier = Supplier(
                    external_code=supplier_code,
                    name=supplier_data.get("label", "Inconnu"),
                    contact_email=supplier_data.get("contact", {}).get("email"),
                    phone=supplier_data.get("contact", {}).get("phoneNumber"),
                )
                session.add(supplier)
                await session.flush()
                print(f"  ✓ Fournisseur créé : {supplier.name}")
            else:
                print(f"  → Fournisseur existant : {supplier.name}")

            # ── Produit ──
            # Dédup par external_code (product.code du JSON), PAS par `model` :
            # `model` doit contenir le libellé produit (lisible), et la tâche 1.6
            # (import des pièces détachées) recherche les produits par
            # external_code — donc c'est la clé de référence obligatoire ici.
            product_code = product_data.get("code")
            existing_product = await session.execute(
                select(Product).where(Product.external_code == product_code)
            )
            product = existing_product.scalar_one_or_none()

            if not product:
                families = product_data.get("families", [])
                category = next(
                    (f["label"] for f in families if f["type"] == "FAMILY"),
                    "AUTRE"
                )
                repairable = product_data.get("repairable")
                if repairable is None:
                    repairable = False

                product = Product(
                    external_code=product_code,
                    brand=product_data.get("brand", "NA"),
                    model=(product_data.get("label") or product_code)[:100],
                    category=category[:50],
                    repairable=repairable,
                    avg_repair_cost=None,  # le prix d'achat n'est pas un coût de réparation
                )
                session.add(product)
                await session.flush()
                print(f"  ✓ Produit créé : {product_data.get('label')}")
            else:
                print(f"  → Produit existant : {product.model}")

            # ── Facture ──
            invoice_number = f"{invoice_data['reference']}-L{line['lineNumber']}"
            existing_invoice = await session.execute(
                select(Invoice).where(Invoice.invoice_number == invoice_number)
            )
            existing_inv = existing_invoice.scalar_one_or_none()

            if not existing_inv:
                warranty = product_data.get("warranty", {})
                warranty_end = calc_warranty_end(
                    issue_date,
                    warranty.get("duration", 2),
                    warranty.get("durationUnitEnum", "YEARS")
                )

                # Si endOfWarrantyDate explicite dans le JSON, il prime sur le calcul
                if line.get("endOfWarrantyDate"):
                    warranty_end = parse_date(line["endOfWarrantyDate"])

                inv = Invoice(
                    client_id=client.id,
                    product_id=product.id,
                    supplier_id=supplier.id,
                    invoice_number=invoice_number,
                    purchase_date=parse_date(issue_date),
                    warranty_end_date=warranty_end or parse_date(issue_date),
                )
                session.add(inv)
                print(f"  ✓ Facture créée : {invoice_number}")
            else:
                print(f"  → Facture existante : {invoice_number}")

        await session.commit()
        print("\n✅ Import terminé avec succès !")


async def main():
    print("📂 Lecture du fichier JSON...")
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    invoices = data.get("invoices", [])
    if not invoices and "invoice" in data:
        invoices = [data["invoice"]]

    print(f"🚀 Import de {len(invoices)} facture(s) en cours...\n")
    for inv_data in invoices:
        ref = inv_data.get("reference", "?")
        print(f"\n📄 Facture {ref}")
        await import_invoice({"invoice": inv_data})

    print(f"\n✅ {len(invoices)} facture(s) importée(s) avec succès !")


if __name__ == "__main__":
    asyncio.run(main())