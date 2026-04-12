# AgentMesh — Project Rules

## HARD RULES (never violate without explicit user instruction)

### Environment Files
- **NEVER read, write, or modify any `.env`, `.env.local`, `.env.*`, or any file containing secrets/credentials** without the user explicitly saying "you can edit the env file" or equivalent.
- If a fix requires an env change, show the user exactly what to change and let them do it.
- This applies to ALL subfolders: `frontend/`, `backend/`, root, etc.

## Project Structure
- `frontend/` — Next.js 15 app (see `frontend/AGENTS.md` for conventions)
- `backend/` — FastAPI app (see `backend/AGENTS.md` for conventions)
