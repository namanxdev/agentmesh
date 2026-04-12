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
        # Allow tests to run without DATABASE_CONN
        if os.getenv("AGENTMESH_ENV") == "test":
            return "postgresql+asyncpg://localhost/agentmesh_test", {"timeout": 5}
        raise RuntimeError("DATABASE_CONN environment variable is required")

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
    # Fail fast instead of hanging when DB is unreachable.
    # asyncpg respects "timeout" (seconds to wait for a connection).
    connect_args.setdefault("timeout", 5)

    return clean_url, connect_args


_URL, _CONNECT_ARGS = _prepare_url(os.environ.get("DATABASE_CONN", ""))

engine = create_async_engine(
    _URL,
    echo=False,
    pool_pre_ping=True,
    connect_args=_CONNECT_ARGS,
    pool_timeout=6,       # seconds to wait for a pool slot
    pool_recycle=1800,    # recycle connections every 30 min
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
