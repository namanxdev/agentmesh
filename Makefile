VENV := .venv
PYTHON := $(VENV)/Scripts/python
UVICORN := $(VENV)/Scripts/uvicorn

.PHONY: dev backend frontend

dev:
	@echo "Starting frontend and backend..."
	@$(MAKE) backend &
	@$(MAKE) frontend

backend:
	$(UVICORN) backend.api.routes:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev
