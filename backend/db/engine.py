import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def _get_url() -> str:
    url = os.environ.get("DATABASE_CONN", "")
    # Neon may provide a postgresql:// URL; SQLAlchemy asyncpg needs postgresql+asyncpg://
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    # Fallback placeholder so imports work without DATABASE_CONN set
    return url or "postgresql+asyncpg://localhost/agentmesh"


engine = create_async_engine(_get_url(), echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
