import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.llm.base import LLMResponse, BaseLLMProvider


def test_llm_response_no_tool_calls():
    resp = LLMResponse(text="Hello", usage={"input": 10, "output": 5})
    assert resp.has_tool_calls is False


def test_llm_response_with_tool_calls():
    resp = LLMResponse(
        text="",
        tool_calls=[{"name": "read_file", "args": {"path": "test.py"}}],
        usage={"input": 20, "output": 10},
    )
    assert resp.has_tool_calls is True


def test_base_provider_is_abstract():
    with pytest.raises(TypeError):
        BaseLLMProvider()


from backend.llm.gemini import GeminiProvider


@pytest.mark.asyncio
async def test_gemini_generate_text():
    mock_part = MagicMock()
    mock_part.function_call = MagicMock()
    mock_part.function_call.name = ""
    mock_part.text = "Looks good."
    mock_response = MagicMock()
    mock_response.parts = [mock_part]
    mock_response.usage_metadata.prompt_token_count = 100
    mock_response.usage_metadata.candidates_token_count = 50

    with patch("google.generativeai.GenerativeModel") as MockModel:
        instance = MagicMock()
        instance.generate_content_async = AsyncMock(return_value=mock_response)
        MockModel.return_value = instance

        provider = GeminiProvider(api_key="test")
        result = await provider.generate(
            messages=[{"role": "user", "content": "Review this"}],
            model="gemini-2.0-flash",
        )

    assert result.text == "Looks good."
    assert result.has_tool_calls is False
    assert result.usage["input"] == 100
