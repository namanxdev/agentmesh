# Auth + DB Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth login, Neon PostgreSQL schema, SQLAlchemy ORM, and a Next.js BFF proxy that authenticates all FastAPI calls — transforming AgentMesh from a stateless demo into a multi-user foundation.

**Architecture:** NextAuth.js v5 handles Google OAuth in Next.js. A server-side API proxy route (`app/api/[...proxy]/route.ts`) intercepts every call to `/api/*`, checks the NextAuth session, injects `X-User-ID` / `X-User-Email` / `X-User-Name` headers, and forwards to FastAPI. FastAPI reads those trusted headers (BFF pattern — FastAPI is not directly browser-accessible). On first request per user, FastAPI upserts the `users` row lazily. This avoids attempting to verify NextAuth v5 JWEs (which use AES-GCM, not plain HS256) in Python.

**Tech Stack:** next-auth@5, @auth/core, SQLAlchemy 2.0 async + asyncpg, Alembic, python-jose (for Sub-project 2 API key Fernet), cryptography, Next.js App Router Route Handlers, Neon PostgreSQL (DATABASE_CONN env var already set).

---

## File Map

**New backend files:**
- `backend/db/__init__.py` — package marker
- `backend/db/engine.py` — async SQLAlchemy engine + `get_db` session dependency
- `backend/db/models.py` — ORM: User, ApiKey, MCPServer, Pipeline, PipelineRun (all 5 tables now, migrated gradually)
- `backend/api/auth_middleware.py` — `get_current_user(x_user_id, db)` FastAPI Depends; lazy-upserts user row
- `backend/alembic/env.py` — Alembic async env
- `backend/alembic/versions/001_initial.py` — CREATE TABLE for all 5 tables
- `backend/alembic/script.py.mako` — Alembic template (required by Alembic)
- `alembic.ini` — at project root

**Modified backend files:**
- `pyproject.toml` — add sqlalchemy[asyncio], asyncpg, alembic, python-jose[cryptography], cryptography, psycopg2-binary
- `backend/api/routes.py` — add one auth-protected test endpoint `GET /api/me`

**New frontend files:**
- `frontend/auth.ts` — NextAuth config (Google provider + jwt/session callbacks)
- `frontend/middleware.ts` — protect `/dashboard`, redirect unauthenticated → `/login`
- `frontend/app/login/page.tsx` — sign-in page with Google button
- `frontend/app/api/auth/[...nextauth]/route.ts` — NextAuth catch-all handler
- `frontend/app/api/[...proxy]/route.ts` — BFF proxy: adds auth headers, forwards to FastAPI
- `frontend/app/providers.tsx` — SessionProvider wrapper (client component)
- `frontend/types/next-auth.d.ts` — augment Session type with `user.id`

**Modified frontend files:**
- `frontend/app/layout.tsx` — wrap with `<Providers>`
- `frontend/package.json` — add next-auth@beta, @auth/core
- `frontend/next.config.ts` — no rewrites needed (proxy route handles it); add env validation comment

**New test files:**
- `tests/backend/test_auth_middleware.py` — unit tests for `get_current_user`

---

## Task 1: Add backend dependencies

**Files:**
- Modify: `pyproject.toml`

- [ ] **Step 1: Add dependencies to pyproject.toml**

  In the `dependencies` list, add after `python-dotenv`:

  ```toml
  "sqlalchemy[asyncio]>=2.0",
  "asyncpg>=0.29",
  "alembic>=1.13",
  "python-jose[cryptography]>=3.3",
  "cryptography>=42.0",
  "psycopg2-binary>=2.9",
  ```

- [ ] **Step 2: Install**

  Run from the project root (`E:\Projects\AgentMesh`):
  ```bash
  pip install -e ".[dev]"
  ```
  Expected: All packages install without error. Verify with `pip show sqlalchemy asyncpg alembic`.

- [ ] **Step 3: Commit**

  ```bash
  git add pyproject.toml
  git commit -m "chore: add sqlalchemy, asyncpg, alembic, jose, cryptography deps"
  ```

---

## Task 2: SQLAlchemy engine and ORM models

**Files:**
- Create: `backend/db/__init__.py`
- Create: `backend/db/engine.py`
- Create: `backend/db/models.py`

- [ ] **Step 1: Write the import test (failing)**

  Create `tests/backend/test_db_models.py`:

  ```python
  """Tests that the DB models and engine module import correctly."""
  import pytest

  def test_engine_module_imports():
      from backend.db.engine import engine, get_db, Base
      assert engine is not None

  def test_models_import():
      from backend.db.models import User, ApiKey, MCPServer, Pipeline, PipelineRun
      # Verify tables are named correctly
      assert User.__tablename__ == "users"
      assert ApiKey.__tablename__ == "api_keys"
      assert MCPServer.__tablename__ == "mcp_servers"
      assert Pipeline.__tablename__ == "pipelines"
      assert PipelineRun.__tablename__ == "pipeline_runs"

  def test_user_columns():
      from backend.db.models import User
      cols = {c.name for c in User.__table__.columns}
      assert {"id", "email", "name", "avatar_url", "created_at"}.issubset(cols)

  def test_api_key_columns():
      from backend.db.models import ApiKey
      cols = {c.name for c in ApiKey.__table__.columns}
      assert {"id", "user_id", "provider", "encrypted_key", "created_at"}.issubset(cols)
  ```

- [ ] **Step 2: Run test to confirm it fails**

  ```bash
  pytest tests/backend/test_db_models.py -v
  ```
  Expected: `ModuleNotFoundError: No module named 'backend.db'`

- [ ] **Step 3: Create `backend/db/__init__.py`**

  ```python
  # empty
  ```

- [ ] **Step 4: Create `backend/db/engine.py`**

  ```python
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
      return url

  engine = create_async_engine(_get_url(), echo=False, pool_pre_ping=True)
  AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

  async def get_db():
      async with AsyncSessionLocal() as session:
          yield session
  ```

- [ ] **Step 5: Create `backend/db/models.py`**

  ```python
  from __future__ import annotations
  from datetime import datetime
  from sqlalchemy import String, Text, Float, Integer, ForeignKey, UniqueConstraint
  from sqlalchemy.orm import mapped_column, relationship, Mapped
  from sqlalchemy.dialects.postgresql import JSONB
  from sqlalchemy.sql import func
  from backend.db.engine import Base

  class User(Base):
      __tablename__ = "users"
      id: Mapped[str] = mapped_column(String, primary_key=True)  # Google sub
      email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
      name: Mapped[str | None] = mapped_column(String, nullable=True)
      avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
      created_at: Mapped[datetime] = mapped_column(server_default=func.now())

      api_keys: Mapped[list[ApiKey]] = relationship(back_populates="user", cascade="all, delete-orphan")
      mcp_servers: Mapped[list[MCPServer]] = relationship(back_populates="user", cascade="all, delete-orphan")
      pipelines: Mapped[list[Pipeline]] = relationship(back_populates="user", cascade="all, delete-orphan")
      pipeline_runs: Mapped[list[PipelineRun]] = relationship(back_populates="user", cascade="all, delete-orphan")


  class ApiKey(Base):
      __tablename__ = "api_keys"
      __table_args__ = (UniqueConstraint("user_id", "provider"),)
      id: Mapped[str] = mapped_column(String, primary_key=True)
      user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      provider: Mapped[str] = mapped_column(String, nullable=False)  # "gemini" | "groq"
      encrypted_key: Mapped[str] = mapped_column(Text, nullable=False)
      created_at: Mapped[datetime] = mapped_column(server_default=func.now())

      user: Mapped[User] = relationship(back_populates="api_keys")


  class MCPServer(Base):
      __tablename__ = "mcp_servers"
      id: Mapped[str] = mapped_column(String, primary_key=True)
      user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      name: Mapped[str] = mapped_column(String, nullable=False)
      server_type: Mapped[str] = mapped_column(String, nullable=False)  # "stdio" | "sse" | "http"
      command_or_url: Mapped[str] = mapped_column(Text, nullable=False)
      env_vars: Mapped[dict] = mapped_column(JSONB, server_default="{}")
      created_at: Mapped[datetime] = mapped_column(server_default=func.now())

      user: Mapped[User] = relationship(back_populates="mcp_servers")


  class Pipeline(Base):
      __tablename__ = "pipelines"
      id: Mapped[str] = mapped_column(String, primary_key=True)
      user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      name: Mapped[str] = mapped_column(String, nullable=False, server_default="'Untitled Pipeline'")
      definition: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default='{"nodes":[],"edges":[]}')
      created_at: Mapped[datetime] = mapped_column(server_default=func.now())
      updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

      user: Mapped[User] = relationship(back_populates="pipelines")
      runs: Mapped[list[PipelineRun]] = relationship(back_populates="pipeline", cascade="all, delete-orphan")


  class PipelineRun(Base):
      __tablename__ = "pipeline_runs"
      id: Mapped[str] = mapped_column(String, primary_key=True)
      user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      pipeline_id: Mapped[str | None] = mapped_column(String, ForeignKey("pipelines.id", ondelete="SET NULL"), nullable=True)
      workflow_id: Mapped[str] = mapped_column(String, nullable=False)
      status: Mapped[str] = mapped_column(String, nullable=False)  # "running"|"completed"|"error"
      total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
      duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
      error: Mapped[str | None] = mapped_column(Text, nullable=True)
      created_at: Mapped[datetime] = mapped_column(server_default=func.now())

      user: Mapped[User] = relationship(back_populates="pipeline_runs")
      pipeline: Mapped[Pipeline | None] = relationship(back_populates="runs")
  ```

- [ ] **Step 6: Run tests to confirm they pass**

  ```bash
  pytest tests/backend/test_db_models.py -v
  ```
  Expected: All 4 tests PASS. (Note: DATABASE_CONN does not need to be set for import-only tests.)

- [ ] **Step 7: Commit**

  ```bash
  git add backend/db/ tests/backend/test_db_models.py
  git commit -m "feat: add SQLAlchemy async engine and ORM models"
  ```

---

## Task 3: Alembic setup and initial migration

**Files:**
- Create: `alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/001_initial.py`

- [ ] **Step 1: Create `alembic.ini` at project root**

  ```ini
  [alembic]
  script_location = backend/alembic
  prepend_sys_path = .
  version_path_separator = os

  [loggers]
  keys = root,sqlalchemy,alembic

  [handlers]
  keys = console

  [formatters]
  keys = generic

  [logger_root]
  level = WARN
  handlers = console
  qualname =

  [logger_sqlalchemy]
  level = WARN
  handlers =
  qualname = sqlalchemy.engine

  [logger_alembic]
  level = INFO
  handlers =
  qualname = alembic

  [handler_console]
  class = StreamHandler
  args = (sys.stderr,)
  level = NOTSET
  formatter = generic

  [formatter_generic]
  format = %(levelname)-5.5s [%(name)s] %(message)s
  datefmt = %H:%M:%S
  ```

- [ ] **Step 2: Create `backend/alembic/env.py`**

  ```python
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
  ```

- [ ] **Step 3: Create `backend/alembic/script.py.mako`**

  ```mako
  """${message}

  Revision ID: ${up_revision}
  Revises: ${down_revision | comma,n}
  Create Date: ${create_date}

  """
  from typing import Sequence, Union

  from alembic import op
  import sqlalchemy as sa
  ${imports if imports else ""}

  revision: str = ${repr(up_revision)}
  down_revision: Union[str, None] = ${repr(down_revision)}
  branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
  depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


  def upgrade() -> None:
      ${upgrades if upgrades else "pass"}


  def downgrade() -> None:
      ${downgrades if downgrades else "pass"}
  ```

- [ ] **Step 4: Create `backend/alembic/versions/001_initial.py`**

  ```python
  """Create initial tables: users, api_keys, mcp_servers, pipelines, pipeline_runs

  Revision ID: 001
  Revises:
  Create Date: 2026-03-26
  """
  from typing import Sequence, Union
  from alembic import op
  import sqlalchemy as sa
  from sqlalchemy.dialects import postgresql

  revision: str = "001"
  down_revision: Union[str, None] = None
  branch_labels: Union[str, Sequence[str], None] = None
  depends_on: Union[str, Sequence[str], None] = None


  def upgrade() -> None:
      op.create_table(
          "users",
          sa.Column("id", sa.String(), primary_key=True),
          sa.Column("email", sa.String(), nullable=False),
          sa.Column("name", sa.String(), nullable=True),
          sa.Column("avatar_url", sa.String(), nullable=True),
          sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
          sa.UniqueConstraint("email", name="uq_users_email"),
      )
      op.create_table(
          "api_keys",
          sa.Column("id", sa.String(), primary_key=True),
          sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
          sa.Column("provider", sa.String(), nullable=False),
          sa.Column("encrypted_key", sa.Text(), nullable=False),
          sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
          sa.UniqueConstraint("user_id", "provider", name="uq_api_keys_user_provider"),
      )
      op.create_table(
          "mcp_servers",
          sa.Column("id", sa.String(), primary_key=True),
          sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
          sa.Column("name", sa.String(), nullable=False),
          sa.Column("server_type", sa.String(), nullable=False),
          sa.Column("command_or_url", sa.Text(), nullable=False),
          sa.Column("env_vars", postgresql.JSONB(), server_default="{}"),
          sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
      )
      op.create_table(
          "pipelines",
          sa.Column("id", sa.String(), primary_key=True),
          sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
          sa.Column("name", sa.String(), nullable=False, server_default="'Untitled Pipeline'"),
          sa.Column("definition", postgresql.JSONB(), nullable=False, server_default='{"nodes":[],"edges":[]}'),
          sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
          sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
      )
      op.create_table(
          "pipeline_runs",
          sa.Column("id", sa.String(), primary_key=True),
          sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
          sa.Column("pipeline_id", sa.String(), sa.ForeignKey("pipelines.id", ondelete="SET NULL"), nullable=True),
          sa.Column("workflow_id", sa.String(), nullable=False),
          sa.Column("status", sa.String(), nullable=False),
          sa.Column("total_tokens", sa.Integer(), nullable=True),
          sa.Column("duration_seconds", sa.Float(), nullable=True),
          sa.Column("error", sa.Text(), nullable=True),
          sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
      )


  def downgrade() -> None:
      op.drop_table("pipeline_runs")
      op.drop_table("pipelines")
      op.drop_table("mcp_servers")
      op.drop_table("api_keys")
      op.drop_table("users")
  ```

- [ ] **Step 5: Verify Alembic config loads without import errors**

  ```bash
  alembic history
  ```
  `alembic history` reads the migration files without connecting to the DB, so it works even if DATABASE_CONN isn't live yet.
  Expected output:
  ```
  001 -> <base>, Create initial tables...
  ```
  If you see an ImportError, fix the import in `backend/alembic/env.py` before proceeding.

- [ ] **Step 6: Commit**

  ```bash
  git add alembic.ini backend/alembic/
  git commit -m "feat: add Alembic setup with initial 5-table migration"
  ```

---

## Task 4: Run Alembic migration against Neon

**Prerequisites:** `DATABASE_CONN` must be set in `.env` with a valid Neon connection string.

- [ ] **Step 1: Verify .env has DATABASE_CONN**

  ```bash
  grep DATABASE_CONN .env
  ```
  Expected: `DATABASE_CONN=postgresql://...neon.tech/...`

- [ ] **Step 2: Run migration**

  ```bash
  alembic upgrade head
  ```
  Expected output:
  ```
  INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
  INFO  [alembic.runtime.migration] Will assume transactional DDL.
  INFO  [alembic.runtime.migration] Running upgrade  -> 001, Create initial tables...
  ```

- [ ] **Step 3: Verify tables exist**

  ```bash
  alembic current
  ```
  Expected: `001 (head)`

- [ ] **Step 4: Commit (no code changes, just confirm state)**

  ```bash
  git commit --allow-empty -m "chore: migration 001 applied to Neon"
  ```

---

## Task 5: FastAPI auth middleware

**Files:**
- Create: `backend/api/auth_middleware.py`
- Create: `tests/backend/test_auth_middleware.py`

- [ ] **Step 1: Write failing tests**

  Create `tests/backend/test_auth_middleware.py`:

  ```python
  import pytest
  from unittest.mock import AsyncMock, MagicMock, patch
  from fastapi import HTTPException


  @pytest.fixture
  def mock_db():
      db = AsyncMock()
      db.execute = AsyncMock()
      db.commit = AsyncMock()
      return db


  @pytest.mark.asyncio
  async def test_get_current_user_missing_header_raises_401(mock_db):
      from backend.api.auth_middleware import get_current_user
      with pytest.raises(HTTPException) as exc_info:
          await get_current_user(
              x_user_id=None,
              x_user_email=None,
              x_user_name=None,
              x_user_image=None,
              db=mock_db,
          )
      assert exc_info.value.status_code == 401


  @pytest.mark.asyncio
  async def test_get_current_user_valid_header_returns_user_id(mock_db):
      from backend.api.auth_middleware import get_current_user
      result = await get_current_user(
          x_user_id="google-sub-123",
          x_user_email="test@example.com",
          x_user_name="Test User",
          x_user_image="https://example.com/photo.jpg",
          db=mock_db,
      )
      assert result == "google-sub-123"


  @pytest.mark.asyncio
  async def test_get_current_user_upserts_user(mock_db):
      from backend.api.auth_middleware import get_current_user
      await get_current_user(
          x_user_id="google-sub-123",
          x_user_email="test@example.com",
          x_user_name="Test User",
          x_user_image=None,
          db=mock_db,
      )
      # Verify upsert SQL was executed
      assert mock_db.execute.called
      assert mock_db.commit.called
  ```

- [ ] **Step 2: Run tests to confirm they fail**

  ```bash
  pytest tests/backend/test_auth_middleware.py -v
  ```
  Expected: `ImportError` or `ModuleNotFoundError` for `backend.api.auth_middleware`

- [ ] **Step 3: Create `backend/api/auth_middleware.py`**

  ```python
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
  ```

- [ ] **Step 4: Run tests to confirm they pass**

  ```bash
  pytest tests/backend/test_auth_middleware.py -v
  ```
  Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add backend/api/auth_middleware.py tests/backend/test_auth_middleware.py
  git commit -m "feat: add FastAPI BFF auth middleware (X-User-ID header)"
  ```

---

## Task 6: Add /api/me endpoint to routes.py

**Files:**
- Modify: `backend/api/routes.py`

This proves the auth middleware integrates with the app, and gives the frontend a way to verify auth.

- [ ] **Step 1: Add `GET /api/me` to `create_app` in `backend/api/routes.py`**

  Inside `create_app`, after the existing endpoints, add:

  ```python
  @app.get("/api/me")
  async def get_me(user_id: str = Depends(get_current_user_dep)):
      return {"user_id": user_id}
  ```

  At the top of `routes.py`, add the import:

  ```python
  from backend.api.auth_middleware import get_current_user as get_current_user_dep
  ```

  Also add the `get_db` import for the dependency injection chain:
  ```python
  from backend.db.engine import get_db  # noqa: F401 — used by auth_middleware Depends
  ```

  Note: `get_current_user` already imports `get_db` via `Depends(get_db)`, so no additional wiring is needed. FastAPI resolves the dependency automatically.

- [ ] **Step 2: Verify the app still starts (smoke test)**

  ```bash
  cd E:\Projects\AgentMesh
  python -c "from backend.api.routes import create_default_app; app = create_default_app(); print('OK')"
  ```
  Expected: `OK` (no import errors)

- [ ] **Step 3: Commit**

  ```bash
  git add backend/api/routes.py
  git commit -m "feat: add GET /api/me auth-protected endpoint"
  ```

---

## Task 7: Install NextAuth.js v5 and create auth.ts

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Create: `frontend/auth.ts`
- Create: `frontend/types/next-auth.d.ts`

- [ ] **Step 1: Install next-auth**

  ```bash
  cd frontend
  npm install next-auth@beta @auth/core
  ```
  Expected: `next-auth@5.x.x` added to `package.json`.

- [ ] **Step 2: Create `frontend/types/next-auth.d.ts`**

  ```typescript
  import NextAuth from "next-auth";

  declare module "next-auth" {
    interface Session {
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      };
    }
  }
  ```

- [ ] **Step 3: Create `frontend/auth.ts`**

  ```typescript
  import NextAuth from "next-auth";
  import Google from "next-auth/providers/google";

  export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    pages: {
      signIn: "/login",
    },
    callbacks: {
      async jwt({ token, account, profile }) {
        // On first sign-in, profile contains the Google user info
        if (account && profile) {
          token.sub = profile.sub;          // Google user ID → our user_id
          token.picture = profile.picture ?? token.picture;
        }
        return token;
      },
      async session({ session, token }) {
        // Expose user ID to server-side components and API routes
        session.user.id = token.sub as string;
        return session;
      },
    },
  });
  ```

  > **Note:** The `session` callback only runs when accessing the session via `auth()` or `useSession()`. The `id` field requires the type augmentation in `next-auth.d.ts`.

- [ ] **Step 4: Add env vars to .env**

  Add to `E:\Projects\AgentMesh\.env`:
  ```env
  # NextAuth
  NEXTAUTH_URL=http://localhost:3000
  NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
  GOOGLE_CLIENT_ID=<from Google Cloud Console OAuth 2.0>
  GOOGLE_CLIENT_SECRET=<from Google Cloud Console OAuth 2.0>

  # FastAPI URL for Next.js proxy
  FASTAPI_URL=http://localhost:8000
  ```

  > **How to get Google OAuth credentials:**
  > 1. Go to https://console.cloud.google.com/
  > 2. Create a project (or use existing)
  > 3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
  > 4. Application type: Web application
  > 5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
  > 6. Copy Client ID and Client Secret to .env

- [ ] **Step 5: Commit**

  ```bash
  cd ..
  git add frontend/auth.ts frontend/types/next-auth.d.ts frontend/package.json frontend/package-lock.json
  git commit -m "feat: add NextAuth.js v5 config with Google provider"
  ```

---

## Task 8: NextAuth route handler and Next.js middleware

**Files:**
- Create: `frontend/app/api/auth/[...nextauth]/route.ts`
- Create: `frontend/middleware.ts`

- [ ] **Step 1: Create `frontend/app/api/auth/[...nextauth]/route.ts`**

  ```typescript
  import { handlers } from "@/auth";
  export const { GET, POST } = handlers;
  ```

  This is the NextAuth v5 catch-all route. All OAuth callbacks (`/api/auth/callback/google`, etc.) are handled here automatically.

- [ ] **Step 2: Create `frontend/middleware.ts`**

  Place in `frontend/middleware.ts` (next to `auth.ts`, at the root of the `frontend/` directory):

  ```typescript
  export { auth as middleware } from "@/auth";

  export const config = {
    matcher: [
      // Protect /dashboard and all sub-routes only
      "/dashboard/:path*",
    ],
  };
  ```

  > **How this works:** NextAuth v5 exports `auth` which can be used directly as Next.js middleware. It checks for a valid session cookie and redirects to `pages.signIn` (`/login`) if not found. The matcher ensures only `/dashboard/*` routes require auth, while other pages (including `/` landing and `/login`) remain public.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd frontend
  npx tsc --noEmit
  ```
  Expected: No errors related to `auth.ts` or `middleware.ts`. (There may be pre-existing errors unrelated to this task — only fix new ones.)

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/app/api/auth/ frontend/middleware.ts
  git commit -m "feat: add NextAuth route handler and dashboard route protection"
  ```

---

## Task 9: Login page

**Files:**
- Create: `frontend/app/login/page.tsx`

- [ ] **Step 1: Create `frontend/app/login/page.tsx`**

  ```tsx
  import { signIn } from "@/auth";

  export const metadata = {
    title: "Sign In — AgentMesh",
  };

  export default function LoginPage() {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: 12,
            padding: "40px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            maxWidth: 400,
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              AgentMesh
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginTop: 8,
              }}
            >
              Sign in to build and run AI pipelines
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            style={{ width: "100%" }}
          >
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "12px 20px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    );
  }
  ```

  > **Note:** The `<form action={async () => { "use server"; ... }}>` pattern is a Next.js 16 Server Action. NextAuth v5's `signIn` function runs server-side. This does not require `"use client"`.

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/app/login/
  git commit -m "feat: add Google OAuth login page"
  ```

---

## Task 10: Next.js BFF proxy route

**Files:**
- Create: `frontend/app/api/[...proxy]/route.ts`

This route intercepts all `/api/*` calls (except `/api/auth/*` which is handled by NextAuth), adds auth headers, and forwards to FastAPI.

- [ ] **Step 1: Create `frontend/app/api/[...proxy]/route.ts`**

  ```typescript
  import { auth } from "@/auth";
  import { NextRequest, NextResponse } from "next/server";

  const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

  async function proxyRequest(
    request: NextRequest,
    { params }: { params: Promise<{ proxy: string[] }> }
  ): Promise<NextResponse> {
    const session = await auth();

    // Reconstruct FastAPI URL: /api/[proxy...] → FASTAPI_URL/api/...
    const { proxy: segments } = await params;
    const path = segments.join("/");
    const targetUrl = new URL(`${FASTAPI_URL}/api/${path}`);

    // Forward query string
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    // Build forwarded headers
    const forwardHeaders = new Headers();

    // Forward content-type and accept
    const contentType = request.headers.get("content-type");
    if (contentType) forwardHeaders.set("content-type", contentType);
    forwardHeaders.set("accept", request.headers.get("accept") ?? "application/json");

    // Add BFF identity headers (trusted because this runs server-side)
    if (session?.user) {
      forwardHeaders.set("x-user-id", session.user.id ?? "");
      forwardHeaders.set("x-user-email", session.user.email ?? "");
      forwardHeaders.set("x-user-name", session.user.name ?? "");
      if (session.user.image) forwardHeaders.set("x-user-image", session.user.image);
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: forwardHeaders,
    };

    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      // Stream the body through
      const body = await request.text();
      if (body) fetchOptions.body = body;
    }

    try {
      const response = await fetch(targetUrl.toString(), fetchOptions);
      const responseText = await response.text();

      const responseHeaders = new Headers();
      const ct = response.headers.get("content-type");
      if (ct) responseHeaders.set("content-type", ct);

      return new NextResponse(responseText, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (err) {
      console.error("[proxy] FastAPI unreachable:", err);
      return NextResponse.json(
        { error: "Backend unavailable" },
        { status: 503 }
      );
    }
  }

  export {
    proxyRequest as GET,
    proxyRequest as POST,
    proxyRequest as PUT,
    proxyRequest as DELETE,
    proxyRequest as PATCH,
  };
  ```

  > **Why no auth check here?** Some endpoints (like `GET /api/workflows`) are public. The auth is enforced at the FastAPI level via `Depends(get_current_user)` on protected endpoints. The proxy always forwards the session user headers when available; FastAPI decides per-endpoint whether to require them.

- [ ] **Step 2: Commit**

  ```bash
  git add "frontend/app/api/[...proxy]/"
  git commit -m "feat: add Next.js BFF proxy route for FastAPI calls"
  ```

---

## Task 11: SessionProvider in layout

**Files:**
- Create: `frontend/app/providers.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Create `frontend/app/providers.tsx`**

  ```tsx
  "use client";
  import { SessionProvider } from "next-auth/react";

  export function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
  }
  ```

  > `SessionProvider` must be a Client Component. By extracting it, `layout.tsx` stays a Server Component.

- [ ] **Step 2: Modify `frontend/app/layout.tsx`**

  Add the import:
  ```tsx
  import { Providers } from "./providers";
  ```

  Wrap `{children}` in `<Providers>`:
  ```tsx
  <body className="min-h-full flex flex-col" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
    <Providers>{children}</Providers>
  </body>
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/app/providers.tsx frontend/app/layout.tsx
  git commit -m "feat: add SessionProvider to root layout"
  ```

---

## Task 12: Update .env.example and verify TypeScript

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update `.env.example`**

  Add the new variables:
  ```env
  # Auth (NextAuth.js)
  NEXTAUTH_URL=http://localhost:3000
  NEXTAUTH_SECRET=<run: openssl rand -base64 32>
  GOOGLE_CLIENT_ID=<from Google Cloud Console>
  GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

  # Database
  DATABASE_CONN=postgresql://user:password@host/dbname

  # Proxy
  FASTAPI_URL=http://localhost:8000

  # API Key Encryption (Sub-project 2)
  # ENCRYPTION_KEY=<run: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  cd frontend
  npx tsc --noEmit 2>&1 | head -50
  ```
  Fix any errors introduced by this sub-project. Pre-existing errors in unrelated files are acceptable.

- [ ] **Step 3: Commit**

  ```bash
  cd ..
  git add .env.example
  git commit -m "docs: update .env.example with auth and DB variables"
  ```

---

## Task 13: End-to-end verification

**No code changes — verification steps only.**

- [ ] **Step 1: Start FastAPI backend**

  ```bash
  # In terminal 1, from E:\Projects\AgentMesh
  uvicorn backend.api.routes:app --reload --port 8000
  ```

- [ ] **Step 2: Start Next.js frontend**

  ```bash
  # In terminal 2, from E:\Projects\AgentMesh\frontend
  npm run dev
  ```

- [ ] **Step 3: Test unauthenticated redirect**

  Open `http://localhost:3000/dashboard` in browser.
  Expected: Redirected to `http://localhost:3000/login`.

- [ ] **Step 4: Test Google OAuth sign-in**

  Click "Continue with Google" on the login page.
  Expected: Google OAuth flow completes → redirected back to `/dashboard`.

- [ ] **Step 5: Verify user row created**

  Check Neon console (or run SQL):
  ```sql
  SELECT id, email, name FROM users;
  ```
  Expected: One row for your Google account.

- [ ] **Step 6: Test /api/me endpoint via proxy**

  From the browser console on `/dashboard`:
  ```javascript
  fetch('/api/me').then(r => r.json()).then(console.log)
  ```
  Expected: `{ user_id: "your-google-sub-id" }`

- [ ] **Step 7: Test /api/me without auth (401)**

  ```bash
  curl http://localhost:8000/api/me
  ```
  Expected: `{"detail":"Unauthorized"}` with HTTP 401 — the `get_current_user` dependency returns 401 when `X-User-ID` header is absent. This confirms FastAPI rejects direct calls that bypass the Next.js proxy.

- [ ] **Step 8: Run all backend tests**

  ```bash
  cd E:\Projects\AgentMesh
  pytest tests/ -v --ignore=tests/backend/test_api.py 2>&1 | tail -20
  ```
  Expected: All previously-passing tests still pass. New auth + db_models tests pass.

- [ ] **Step 9: Final commit**

  ```bash
  git add .
  git commit -m "feat: Sub-project 1 complete — Google OAuth + Neon DB + BFF auth proxy"
  ```

---

## Checklist (from spec)

- [ ] Visiting `/dashboard` logged out → redirects to `/login`
- [ ] Google OAuth completes → session cookie set, `/dashboard` loads
- [ ] `users` row created in Neon
- [ ] FastAPI endpoint with `get_current_user` dep returns 401 without X-User-ID header, 200 with valid headers
