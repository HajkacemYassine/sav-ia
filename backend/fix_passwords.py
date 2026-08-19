import asyncio
import os
from sqlalchemy import text
from app.db.session import engine
from app.core.security import hash_password

async def main():
    pw =pw = hash_password(os.getenv("DEFAULT_PASSWORD", "changeme"))
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE clients SET password_hash = :pw WHERE password_hash = ''"),
            {"pw": pw},
        )
        await conn.execute(
            text("UPDATE technicians SET password_hash = :pw WHERE password_hash = ''"),
            {"pw": pw},
        )
        await conn.execute(
            text("UPDATE admins SET password_hash = :pw WHERE password_hash = ''"),
            {"pw": pw},
        )
        print("Updated empty password_hash rows")

asyncio.run(main())
