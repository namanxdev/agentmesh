from typing import Optional
from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.db.engine import get_db


async def get_current_user(
    x_user_id: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    x_user_image: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    BFF auth dependency. Reads trusted headers set by the Next.js proxy.
    Lazy-upserts the user row in Postgres on every call.
    Returns the user_id (Google sub).
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    await db.execute(
        text("""
            INSERT INTO users (id, email, name, avatar_url)
            VALUES (:id, :email, :name, :avatar_url)
            ON CONFLICT (id) DO UPDATE
                SET email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    avatar_url = EXCLUDED.avatar_url
        """),
        {
            "id": x_user_id,
            "email": x_user_email or "",
            "name": x_user_name,
            "avatar_url": x_user_image,
        },
    )
    await db.commit()
    return x_user_id
