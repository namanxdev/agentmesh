import asyncio
import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

# Import Base so all models are registered
import backend.db.models  # noqa: F401 — registers all ORM classes
from backend.db.engine import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _prepare_url(raw: str) -> tuple[str, dict]:
    from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

    raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    raw = raw.replace("postgres://", "postgresql+asyncpg://", 1)
    parsed = urlparse(raw)
    params = parse_qs(parsed.query)
    needs_ssl = "sslmode" in params
    for key in ("sslmode", "channel_binding"):
        params.pop(key, None)
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=clean_query))
    connect_args: dict = {}
    if needs_ssl:
        connect_args["ssl"] = True
    return clean_url, connect_args


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    url, connect_args = _prepare_url(os.environ["DATABASE_CONN"])
    engine = create_async_engine(url, connect_args=connect_args)
    async with engine.begin() as conn:
        await conn.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


run_migrations_online()
