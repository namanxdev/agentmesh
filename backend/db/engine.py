import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

load_dotenv()


class Base(DeclarativeBase):
    pass


def _prepare_url(raw: str) -> tuple[str, dict]:
    """
    Convert a postgres:// URL to postgresql+asyncpg://.
    Strip asyncpg-incompatible query params (sslmode, channel_binding) and
    return them as connect_args instead.
    """
    if not raw:
        return "postgresql+asyncpg://localhost/agentmesh", {}

    raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    raw = raw.replace("postgres://", "postgresql+asyncpg://", 1)

    parsed = urlparse(raw)
    params = parse_qs(parsed.query)

    needs_ssl = "sslmode" in params
    # Remove params asyncpg doesn't understand
    for key in ("sslmode", "channel_binding"):
        params.pop(key, None)

    clean_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=clean_query))

    connect_args: dict = {}
    if needs_ssl:
        connect_args["ssl"] = True

    return clean_url, connect_args


_URL, _CONNECT_ARGS = _prepare_url(os.environ.get("DATABASE_CONN", ""))

engine = create_async_engine(_URL, echo=False, pool_pre_ping=True, connect_args=_CONNECT_ARGS)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
