FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy source code
COPY backend/ ./backend/
COPY alembic.ini ./

# Copy alembic migration scripts (located inside backend/)
# backend/alembic/ is already included in the COPY above

# Create entrypoint script
RUN printf '#!/bin/sh\nset -e\necho "Running database migrations..."\nuv run alembic upgrade head\necho "Starting AgentMesh backend..."\nexec uv run uvicorn backend.api.routes:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 8000

CMD ["/entrypoint.sh"]
