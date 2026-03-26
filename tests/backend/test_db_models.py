"""Tests that the DB models and engine module import correctly."""
import pytest


def test_engine_module_imports():
    from backend.db.engine import engine, get_db, Base
    assert engine is not None


def test_models_import():
    from backend.db.models import User, ApiKey, MCPServer, Pipeline, PipelineRun
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
