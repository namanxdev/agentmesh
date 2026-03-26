# Auth, DB, API Keys, MCP Config & Pipeline Persistence — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Transform AgentMesh from a stateless demo into a multi-user SaaS product. Users log in via Google OAuth, store their own LLM API keys and MCP server configs, and their pipelines auto-save to Neon PostgreSQL. Four sequential sub-projects, each building on the last.

---

## Sub-projects (build in order)

| # | Name | Scope |
|---|------|-------|
| 1 | Auth + DB Foundation | NextAuth.js v5 Google OAuth, Neon schema, FastAPI JWT middleware |
| 2 | API Key Management | Settings modal, encrypted key storage, per-run key injection |
| 3 | MCP Server Config | Add/remove servers UI, ToolNode live dropdown, on-demand MCP client |
| 4 | Pipeline Persistence + Run History | Auto-save canvas, load on login, run history panel |

---

## Architecture

### Request flow

```
Browser (session cookie)
  → Next.js API route /api/auth/* (NextAuth.js handles OAuth callbacks)
  → All other requests: Next.js fetches FastAPI with Bearer JWT
  → FastAPI middleware verifies JWT using NEXTAUTH_SECRET
  → Extracts user_id for all DB queries
```

### Auth flow (Sub-project 1)

1. User visits `/dashboard` → NextAuth middleware redirects to `/login` if no session
2. User clicks "Sign in with Google" → OAuth dance → session cookie set
3. On session create: upsert `users` row (email, name, avatar_url)
4. Each FastAPI call: Next.js passes `Authorization: Bearer <jwt>` header
5. FastAPI `AuthMiddleware` verifies JWT with `python-jose`, extracts `sub` (user_id)

---

## Database Schema (Neon PostgreSQL)

Connection: `DATABASE_CONN` env var (already in `.env`)

```sql
-- Sub-project 1
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Sub-project 2
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('gemini', 'groq')),
  encrypted_key TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Sub-project 3
CREATE TABLE mcp_servers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  server_type     TEXT NOT NULL CHECK (server_type IN ('stdio', 'sse', 'http')),
  command_or_url  TEXT NOT NULL,
  env_vars        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Sub-project 4
CREATE TABLE pipelines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Untitled Pipeline',
  definition  JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pipeline_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pipeline_id      UUID REFERENCES pipelines(id) ON DELETE SET NULL,
  workflow_id      TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('running','completed','error')),
  total_tokens     INT,
  duration_seconds FLOAT,
  error            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

---

## Key Technical Decisions

| Concern | Decision | Why |
|---------|----------|-----|
| Frontend auth | `next-auth@5` (Auth.js) | Native Next.js 16 App Router support |
| Session format | JWT (not DB sessions) | Stateless; FastAPI can verify without DB lookup |
| FastAPI JWT verify | `python-jose` with `NEXTAUTH_SECRET` | Same secret NextAuth signs with |
| API key storage | Fernet symmetric encryption (`cryptography` lib) | Never stored plaintext; `ENCRYPTION_KEY` in env |
| ORM | SQLAlchemy 2.0 async + asyncpg driver | Matches FastAPI's async; Alembic for migrations |
| Pipeline save | Debounced auto-save (2s) + explicit Save button | Prevents lost work without spamming DB |
| MCP on-demand | Start MCP client per-run from user's stored config | Reuses existing `MCPRegistry` pattern |
| Protected routes | NextAuth middleware on `/dashboard` | Redirect to `/login` if no session |

---

## New Packages

**Frontend:**
```json
"next-auth": "^5.0.0-beta.28",
"@auth/core": "latest"
```

**Backend (requirements.txt additions):**
```
sqlalchemy[asyncio]>=2.0
asyncpg>=0.29
alembic>=1.13
python-jose[cryptography]>=3.3
cryptography>=42.0
```

---

## New Environment Variables

```env
# Sub-project 1 (auth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<32-char random string>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Sub-project 2 (API key encryption)
ENCRYPTION_KEY=<Fernet key from Fernet.generate_key()>
```

---

## File Structure

### Sub-project 1: Auth + DB Foundation

```
frontend/
  auth.ts                          # NextAuth config (providers, callbacks, JWT options)
  middleware.ts                    # Protect /dashboard route
  app/
    login/page.tsx                 # Sign-in page with Google button
    api/auth/[...nextauth]/route.ts  # NextAuth catch-all route handler
  lib/
    auth-client.ts                 # getSession helper + fetch wrapper that injects Bearer token

backend/
  db/
    __init__.py
    engine.py                      # SQLAlchemy async engine from DATABASE_CONN
    models.py                      # ORM models: User, ApiKey, MCPServer, Pipeline, PipelineRun
  api/
    auth_middleware.py             # FastAPI Depends: verify JWT → user_id
  alembic/
    env.py
    versions/001_initial.py        # Create all 5 tables
  alembic.ini
```

### Sub-project 2: API Key Management

```
frontend/
  components/settings/
    SettingsModal.tsx              # Tabbed modal: API Keys tab, MCP Servers tab (later)
    ApiKeyForm.tsx                 # Gemini + Groq key inputs, save/delete per provider
  hooks/
    useApiKeys.ts                  # SWR/fetch: GET/POST/DELETE /api/user/api-keys

backend/
  api/
    user_routes.py                 # GET/POST/DELETE /api/user/api-keys
                                   # GET/POST/DELETE /api/user/mcp-servers (Sub-project 3)
```

### Sub-project 3: MCP Server Config

```
frontend/
  components/settings/
    McpServerForm.tsx              # Add MCP server: name, type (stdio/sse/http), command/url, env vars

backend/
  (user_routes.py extended with mcp-servers endpoints)
  pipelines/validator.py          # pipeline_to_workflow_config extended: reads user's MCP servers
```

### Sub-project 4: Pipeline Persistence

```
frontend/
  hooks/
    usePipelinePersistence.ts      # auto-save debounce + load-on-mount
  components/dashboard/
    RunHistoryPanel.tsx            # Timeline replacement: past runs list

backend/
  api/
    pipeline_routes.py             # GET/POST/PUT/DELETE /api/user/pipelines
                                   # GET /api/user/pipeline-runs
```

---

## FastAPI Auth Middleware Pattern

```python
# backend/api/auth_middleware.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

bearer = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
) -> str:
    """Returns user_id (sub claim) from NextAuth JWT."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            os.environ["NEXTAUTH_SECRET"],
            algorithms=["HS256"],
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## NextAuth Config Pattern

```typescript
// frontend/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub; // Google user ID → used as user_id
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
  },
});
```

---

## API Key Encryption Pattern

```python
# backend/api/user_routes.py
from cryptography.fernet import Fernet
import os

def get_fernet() -> Fernet:
    return Fernet(os.environ["ENCRYPTION_KEY"].encode())

def encrypt_key(raw: str) -> str:
    return get_fernet().encrypt(raw.encode()).decode()

def decrypt_key(encrypted: str) -> str:
    return get_fernet().decrypt(encrypted.encode()).decode()
```

---

## Per-Run Key Injection

When `POST /api/pipelines/run` is called:
1. Look up `api_keys` row for the authenticated user's preferred provider
2. Decrypt the key
3. Instantiate `GeminiProvider(api_key=decrypted)` or `GroqProvider`
4. Pass to `pipeline_to_workflow_config` instead of the global `llm_provider`

This means the server-level `llm_provider` becomes a fallback; per-user keys take priority.

---

## Pipeline Auto-Save

- `pipelineStore` exposes `currentPipelineId: string | null`
- On mount: fetch `GET /api/user/pipelines` → load most recent pipeline into store
- On nodes/edges change: debounce 2s → `PUT /api/user/pipelines/{id}` or `POST` if no id yet
- Explicit Save button: immediate save, shows "Saved" badge

---

## Verification Checklist

**Sub-project 1:**
- [ ] Visiting `/dashboard` logged out → redirects to `/login`
- [ ] Google OAuth completes → session cookie set, `/dashboard` loads
- [ ] `users` row created in Neon
- [ ] FastAPI endpoint with `get_current_user` dep returns 401 without token, 200 with valid JWT

**Sub-project 2:**
- [ ] Settings modal opens from header
- [ ] Enter Gemini API key → stored encrypted in `api_keys` table
- [ ] Run pipeline → uses stored key (visible via agent calling Gemini)
- [ ] Delete key → subsequent run uses fallback env var key

**Sub-project 3:**
- [ ] Add MCP server in Settings → row in `mcp_servers`
- [ ] ToolNode inspector shows dropdown of user's servers
- [ ] Pipeline run with ToolNode → MCP client starts on-demand

**Sub-project 4:**
- [ ] Canvas auto-saves after 2s idle → `pipelines` row updated
- [ ] Refresh page → last pipeline loads
- [ ] After run → `pipeline_runs` row with status/duration/tokens
- [ ] Run history panel shows past runs
