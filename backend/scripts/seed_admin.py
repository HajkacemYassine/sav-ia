"""
Script pour créer l'administrateur par défaut.

Usage :
    cd backend
    python -m scripts.seed_admin

Ou avec des arguments personnalisés :
    python -m scripts.seed_admin --email admin@monsite.com --password MonMotDePasse --name "Admin Principal"
"""
import asyncio
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.admin import Admin
from app.core.security import hash_password


async def create_admin(email: str, password: str, full_name: str):
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(Admin).where(Admin.email == email))
        if existing.scalar_one_or_none():
            print(f"Un admin avec l'email {email} existe déjà.")
            return

        admin = Admin(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Admin '{full_name}' ({email}) créé avec succès.")


def main():
    parser = argparse.ArgumentParser(description="Créer un administrateur par défaut")
    parser.add_argument("--email", default="admin@sav-ia.local", help="Email de l'admin")
    parser.add_argument("--password", default=os.getenv("ADMIN_SEED_PASSWORD", "Admin@123"), help="Mot de passe (ou variable ADMIN_SEED_PASSWORD)")
    parser.add_argument("--name", default="Administrateur", help="Nom complet")
    args = parser.parse_args()

    asyncio.run(create_admin(args.email, args.password, args.name))


if __name__ == "__main__":
    main()
