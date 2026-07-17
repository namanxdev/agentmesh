from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.llm.base import BaseLLMProvider, LLMResponse
from backend.llm.catalog import (
    MODEL_PROVIDER,
    VALID_PROVIDERS,
    create_provider,
    provider_for_model,
)


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


@pytest.mark.parametrize(
    ("model", "provider"),
    [
        ("gemini-2.5-flash", "gemini"),
        ("llama-3.3-70b-versatile", "groq"),
        ("gpt-4o-mini", "openai"),
        ("grok-4.5", "xai"),
        ("deepseek-v4-pro", "deepseek"),
        ("~anthropic/claude-sonnet-latest", "openrouter"),
        ("mistral-large-latest", "mistral"),
        ("meta-llama/Llama-3.3-70B-Instruct-Turbo", "together"),
        ("gpt-oss-120b", "cerebras"),
    ],
)
def test_provider_catalog_routes_models(model, provider):
    assert provider_for_model(model) == provider
    assert MODEL_PROVIDER[model] == provider


def test_provider_catalog_contains_expanded_key_options():
    assert VALID_PROVIDERS == {
        "gemini",
        "groq",
        "openai",
        "xai",
        "deepseek",
        "openrouter",
        "mistral",
        "together",
        "cerebras",
    }


def test_provider_catalog_rejects_unknown_models():
    with pytest.raises(ValueError, match="Unsupported model"):
        provider_for_model("mystery-model")


def test_create_xai_provider_uses_xai_base_url():
    with patch("backend.llm.openai_provider.AsyncOpenAI") as mock_openai:
        create_provider("xai", "xai-test-key")

    mock_openai.assert_called_once_with(
        api_key="xai-test-key",
        base_url="https://api.x.ai/v1",
    )


def test_create_openrouter_provider_adds_app_headers():
    with patch("backend.llm.openai_provider.AsyncOpenAI") as mock_openai:
        create_provider("openrouter", "openrouter-test-key")

    options = mock_openai.call_args.kwargs
    assert options["base_url"] == "https://openrouter.ai/api/v1"
    assert options["default_headers"]["X-OpenRouter-Title"] == "AgentMesh"


from backend.llm.gemini import GeminiProvider


@pytest.mark.asyncio
async def test_gemini_generate_text():
    mock_part = MagicMock()
    mock_part.function_call = MagicMock()
    mock_part.function_call.name = ""
    mock_part.text = "Looks good."

    mock_candidate = MagicMock()
    mock_candidate.content.parts = [mock_part]

    mock_response = MagicMock()
    mock_response.candidates = [mock_candidate]
    mock_response.usage_metadata.prompt_token_count = 100
    mock_response.usage_metadata.candidates_token_count = 50

    with patch("google.genai.Client") as MockClient:
        instance = MagicMock()
        instance.aio.models.generate_content = AsyncMock(return_value=mock_response)
        MockClient.return_value = instance

        provider = GeminiProvider(api_key="test")
        result = await provider.generate(
            messages=[{"role": "user", "content": "Review this"}],
            model="gemini-2.5-flash",
        )

    assert result.text == "Looks good."
    assert result.has_tool_calls is False
    assert result.usage["input"] == 100


from backend.llm.groq import GroqProvider


@pytest.mark.asyncio
async def test_groq_generate_text():
    mock_choice = MagicMock()
    mock_choice.message.content = "Security scan complete."
    mock_choice.message.tool_calls = None
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_response.usage.prompt_tokens = 80
    mock_response.usage.completion_tokens = 40

    with patch("backend.llm.groq.AsyncGroq") as MockGroq:
        instance = MagicMock()
        instance.chat.completions.create = AsyncMock(return_value=mock_response)
        MockGroq.return_value = instance

        provider = GroqProvider(api_key="test")
        result = await provider.generate(
            messages=[{"role": "user", "content": "Scan for vulnerabilities"}],
        )

    assert result.text == "Security scan complete."
    assert result.has_tool_calls is False
