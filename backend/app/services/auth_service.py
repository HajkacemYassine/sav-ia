from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.client import Client
from app.models.technician import Technician
from app.models.admin import Admin
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse


async def register_user(db: AsyncSession, data: RegisterRequest) -> TokenResponse:
    if data.role == "client":
        existing = await db.execute(select(Client).where(Client.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Un compte avec cet email existe déjà")
        user = Client(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            phone=data.phone,
            address=data.address,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        user_id = str(user.id)
        label = user.full_name

    elif data.role == "technician":
        existing = await db.execute(select(Technician).where(Technician.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Un compte avec cet email existe déjà")
        user = Technician(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            speciality=data.speciality,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        user_id = str(user.id)
        label = user.full_name

    else:
        raise HTTPException(status_code=400, detail="Rôle invalide pour l'inscription")

    access_token = create_access_token({"sub": user_id, "role": data.role})
    refresh_token = create_refresh_token({"sub": user_id, "role": data.role})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(id=user_id, email=data.email, role=data.role, label=label),
    )


async def authenticate_user(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    if data.role == "admin":
        result = await db.execute(select(Admin).where(Admin.email == data.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Compte administrateur désactivé")
        user_id = str(user.id)
        label = user.full_name

    elif data.role == "client":
        result = await db.execute(select(Client).where(Client.email == data.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        user_id = str(user.id)
        label = user.full_name

    elif data.role == "technician":
        result = await db.execute(select(Technician).where(Technician.email == data.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        user_id = str(user.id)
        label = user.full_name

    else:
        raise HTTPException(status_code=400, detail="Rôle invalide")

    access_token = create_access_token({"sub": user_id, "role": data.role})
    refresh_token = create_refresh_token({"sub": user_id, "role": data.role})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(id=user_id, email=data.email, role=data.role, label=label),
    )


async def refresh_access_token(db: AsyncSession, refresh_token_str: str) -> TokenResponse:
    payload = decode_token(refresh_token_str)

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de rafraîchissement invalide")

    user_id = payload.get("sub")
    role = payload.get("role")
    if not user_id or not role:
        raise HTTPException(status_code=401, detail="Token de rafraîchissement invalide")

    if role == "admin":
        result = await db.execute(select(Admin).where(Admin.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Compte introuvable ou inactif")
        email = user.email
        label = user.full_name
    elif role == "client":
        result = await db.execute(select(Client).where(Client.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="Client introuvable")
        email = user.email
        label = user.full_name
    elif role == "technician":
        result = await db.execute(select(Technician).where(Technician.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="Technicien introuvable")
        email = user.email
        label = user.full_name
    else:
        raise HTTPException(status_code=401, detail="Rôle inconnu")

    new_access = create_access_token({"sub": user_id, "role": role})
    new_refresh = create_refresh_token({"sub": user_id, "role": role})

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user=UserResponse(id=user_id, email=email, role=role, label=label),
    )
