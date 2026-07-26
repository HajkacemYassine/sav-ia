from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Moteur de connexion async
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,        # Affiche les requêtes SQL en dev
    pool_size=10,
    max_overflow=20,
)

# Fabrique de sessions
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Dépendance FastAPI — utilisée dans chaque route
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise