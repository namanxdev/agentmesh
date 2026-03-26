import pytest
from unittest.mock import AsyncMock
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
    assert mock_db.execute.called
    assert mock_db.commit.called
