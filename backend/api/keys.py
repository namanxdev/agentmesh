import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.api.auth_middleware import get_current_user
from backend.db.engine import get_db
from backend.crypto import encrypt

router = APIRouter(prefix="/api/keys", tags=["keys"])

VALID_PROVIDERS = {"gemini", "groq", "openai"}


class SaveKeyRequest(BaseModel):
    provider: str
    api_key: str


@router.get("")
async def list_keys(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT provider, created_at FROM api_keys WHERE user_id = :uid ORDER BY provider"),
        {"uid": user_id},
    )
    rows = result.fetchall()
    return {"keys": [{"provider": r.provider, "saved_at": str(r.created_at)} for r in rows]}


@router.post("")
async def save_key(
    body: SaveKeyRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.provider not in VALID_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{body.provider}'")
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="api_key must not be empty")

    encrypted = encrypt(body.api_key.strip())
    await db.execute(
        text("""
            INSERT INTO api_keys (id, user_id, provider, encrypted_key)
            VALUES (:id, :uid, :provider, :key)
            ON CONFLICT (user_id, provider) DO UPDATE
                SET encrypted_key = EXCLUDED.encrypted_key
        """),
        {
            "id": str(uuid.uuid4()),
            "uid": user_id,
            "provider": body.provider,
            "key": encrypted,
        },
    )
    await db.commit()
    return {"ok": True, "provider": body.provider}


@router.delete("/{provider}")
async def delete_key(
    provider: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if provider not in VALID_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{provider}'")
    await db.execute(
        text("DELETE FROM api_keys WHERE user_id = :uid AND provider = :provider"),
        {"uid": user_id, "provider": provider},
    )
    await db.commit()
    return {"ok": True, "provider": provider}
