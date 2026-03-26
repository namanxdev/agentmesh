import asyncio
import os
from logging.config import fileConfig
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from dotenv import load_dotenv
load_dotenv()

# Import Base so all models are registered
from backend.db.engine import Base
import backend.db.models  # noqa: F401 — registers all ORM classes

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _get_url() -> str:
    url = os.environ["DATABASE_CONN"]
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    engine = create_async_engine(_get_url())
    async with engine.begin() as conn:
        await conn.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


run_migrations_online()
