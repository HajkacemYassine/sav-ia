import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.models.technician import Technician

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

TECHNICIANS = [
    {"full_name": "Karim Belaïd", "email": "karim.belaid@sav-ia.local", "speciality": "Électroménager", "is_available": True},
    {"full_name": "Sofia Mansour", "email": "sofia.mansour@sav-ia.local", "speciality": "Réfrigération", "is_available": True},
    {"full_name": "Yassine Trabelsi", "email": "yassine.trabelsi@sav-ia.local", "speciality": "Électronique", "is_available": False},
]


async def main():
    async with AsyncSessionLocal() as session:
        for t in TECHNICIANS:
            existing = await session.execute(
                select(Technician).where(Technician.email == t["email"])
            )
            if existing.scalar_one_or_none():
                print(f"  → Déjà présent : {t['full_name']}")
                continue
            session.add(Technician(**t))
            print(f"  ✓ Créé : {t['full_name']} ({t['speciality']})")
        await session.commit()
    print("\n✅ Techniciens de test ajoutés !")


if __name__ == "__main__":
    asyncio.run(main())