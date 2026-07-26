
import argparse
import json
import sys
from pathlib import Path
 
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
 
sys.path.insert(0, str(Path(__file__).parent.parent))
 
from app.core.config import settings  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.product_spare_part import ProductSparePart  # noqa: E402
from app.models.spare_part import SparePart  # noqa: E402
from app.models.supplier import Supplier  # noqa: E402
 
 
# --------------------------------------------------------------------------- #
# Connexion DB
# --------------------------------------------------------------------------- #
 
def get_session() -> Session:
    sync_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
    engine = create_engine(sync_url, echo=False)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()
 
 
# --------------------------------------------------------------------------- #
# Get-or-create
# --------------------------------------------------------------------------- #
 
def get_or_create_supplier(session: Session, supplier_data: dict) -> Supplier:
    code = supplier_data.get("code")
    supplier = session.query(Supplier).filter_by(external_code=code).first()
    if supplier:
        return supplier
 
    supplier = Supplier(
        external_code=code,
        name=supplier_data.get("name", "Fournisseur Inconnu"),
        contact_email=None,
        phone=None,
    )
    session.add(supplier)
    session.flush()
    print(f"    [+] Fournisseur créé : {supplier.name} (code={code})")
    return supplier
 
 
def get_or_create_spare_part(session: Session, part: dict, supplier_data: dict | None, supplier: Supplier | None) -> SparePart:
    part_code = part.get("code", "UNKNOWN")
    reference = f"{part_code}-{supplier_data['code']}" if supplier_data else part_code
    reference = reference[:100]
 
    spare_part = session.query(SparePart).filter_by(reference=reference).first()
    if spare_part:
        return spare_part
 
    if supplier_data and supplier_data.get("unitPrice"):
        price = supplier_data["unitPrice"].get("value", 0)
    else:
        price = part.get("approximatePrice", {}).get("value", 0)
 
    name = (part.get("label") or part_code)[:200]
 
    spare_part = SparePart(
        reference=reference,
        name=name,
        price=price,
        stock_quantity=0,
        supplier_id=supplier.id if supplier else None,
    )
    session.add(spare_part)
    session.flush()
    print(f"    [+] Pièce créée : {name} (ref={reference})")
    return spare_part
 
 
def link_product_spare_part(session: Session, product: Product, spare_part: SparePart, part: dict) -> None:
    existing = (
        session.query(ProductSparePart)
        .filter_by(product_id=product.id, spare_part_id=spare_part.id)
        .first()
    )
    if existing:
        return
 
    compatibilities = part.get("compatibilities", [])
    compatibility_note = ", ".join(compatibilities) if compatibilities else None
 
    link = ProductSparePart(
        product_id=product.id,
        spare_part_id=spare_part.id,
        is_primary=False,
        compatibility_note=compatibility_note,
    )
    session.add(link)
 
 
# --------------------------------------------------------------------------- #
# Import principal
# --------------------------------------------------------------------------- #
 
def import_parts_file(session: Session, filepath: Path) -> None:
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
 
    entries = data["spareParts"]
 
    parts_processed, links_created, products_skipped = 0, 0, 0
 
    for entry in entries:
        product_code = entry["productCode"]
        product_label = entry.get("productLabel", "")
 
        product = session.query(Product).filter_by(external_code=product_code).first()
        if not product:
            print(
                f"  [skip] Produit introuvable pour productCode={product_code} ({product_label}). "
                f"Importez d'abord ce produit (ex: via import_invoices.py)."
            )
            products_skipped += 1
            continue
 
        print(f"  Produit: {product_label} (code={product_code})")
 
        for part in entry.get("parts", []):
            suppliers = part.get("suppliers", [])
 
            if not suppliers:
                spare_part = get_or_create_spare_part(session, part, None, None)
                link_product_spare_part(session, product, spare_part, part)
                parts_processed += 1
                links_created += 1
                continue
 
            for supplier_data in suppliers:
                supplier = get_or_create_supplier(session, supplier_data)
                spare_part = get_or_create_spare_part(session, part, supplier_data, supplier)
                link_product_spare_part(session, product, spare_part, part)
                parts_processed += 1
                links_created += 1
 
    session.commit()
    print(
        f"\nTerminé. {parts_processed} pièce(s) traitée(s), {links_created} lien(s) produit-pièce, "
        f"{products_skipped} produit(s) ignoré(s) (non trouvé en DB)."
    )
 
 
def main() -> None:
    parser = argparse.ArgumentParser(description="Import spare_parts_by_product.json")
    parser.add_argument(
        "--file",
        type=Path,
        default=Path(__file__).parent.parent / "scripts" / "spare_parts_by_product.json",
        help="Chemin vers le fichier JSON à importer (défaut: backend/scripts/spare_parts_by_product.json)",
    )
    args = parser.parse_args()
 
    if not args.file.exists():
        print(f"Erreur : fichier introuvable -> {args.file}")
        sys.exit(1)
 
    session = get_session()
    try:
        import_parts_file(session, args.file)
    except Exception as exc:
        session.rollback()
        print(f"Erreur durant l'import, rollback effectué : {exc}")
        raise
    finally:
        session.close()
 
 
if __name__ == "__main__":
    main()
 