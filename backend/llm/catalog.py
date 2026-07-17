"""Supported LLM providers and model-to-provider routing."""

from typing import Final

from .base import BaseLLMProvider


PROVIDER_CATALOG: Final[dict[str, dict]] = {
    "gemini": {
        "label": "Google Gemini",
        "models": ("gemini-2.5-flash", "gemini-2.5-pro"),
    },
    "groq": {
        "label": "Groq",
        "models": ("llama-3.3-70b-versatile", "llama-3.1-8b-instant"),
    },
    "openai": {
        "label": "OpenAI",
        "models": ("gpt-4o", "gpt-4o-mini"),
    },
    "xai": {
        "label": "xAI",
        "base_url": "https://api.x.ai/v1",
        "models": ("grok-4.5", "grok-4.3"),
    },
    "deepseek": {
        "label": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "models": ("deepseek-v4-flash", "deepseek-v4-pro"),
    },
    "openrouter": {
        "label": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "models": ("~openai/gpt-latest", "~anthropic/claude-sonnet-latest"),
        "default_headers": {
            "X-OpenRouter-Title": "AgentMesh",
        },
    },
    "mistral": {
        "label": "Mistral AI",
        "base_url": "https://api.mistral.ai/v1",
        "models": ("mistral-large-latest", "mistral-small-latest"),
    },
    "together": {
        "label": "Together AI",
        "base_url": "https://api.together.xyz/v1",
        "models": (
            "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "Qwen/Qwen3-235B-A22B-Instruct-2507-tput",
        ),
    },
    "cerebras": {
        "label": "Cerebras",
        "base_url": "https://api.cerebras.ai/v1",
        "models": ("gpt-oss-120b", "zai-glm-4.7", "gemma-4-31b"),
    },
}

VALID_PROVIDERS: Final[frozenset[str]] = frozenset(PROVIDER_CATALOG)
PROVIDER_DISPLAY_NAMES: Final[dict[str, str]] = {
    provider_id: config["label"] for provider_id, config in PROVIDER_CATALOG.items()
}
MODEL_PROVIDER: Final[dict[str, str]] = {
    model: provider_id
    for provider_id, config in PROVIDER_CATALOG.items()
    for model in config["models"]
}


def provider_for_model(model: str) -> str:
    """Return the provider id for a supported model, including legacy models."""
    if model in MODEL_PROVIDER:
        return MODEL_PROVIDER[model]

    model_lower = model.lower()
    if model_lower.startswith("gemini"):
        return "gemini"
    if model_lower.startswith(("gpt", "o1", "o3", "o4")):
        return "openai"
    if model_lower.startswith("grok"):
        return "xai"
    if model_lower.startswith("deepseek"):
        return "deepseek"
    if model_lower.startswith("mistral"):
        return "mistral"
    if model_lower.startswith(("llama", "mixtral")):
        return "groq"

    raise ValueError(f"Unsupported model '{model}'")


def create_provider(provider_id: str, api_key: str) -> BaseLLMProvider:
    """Create the provider client associated with a stored key."""
    if provider_id == "gemini":
        from .gemini import GeminiProvider

        return GeminiProvider(api_key=api_key)
    if provider_id == "groq":
        from .groq import GroqProvider

        return GroqProvider(api_key=api_key)

    config = PROVIDER_CATALOG.get(provider_id)
    if config is None:
        raise ValueError(f"Unknown provider '{provider_id}'")

    from .openai_provider import OpenAIProvider

    return OpenAIProvider(
        api_key=api_key,
        base_url=config.get("base_url"),
        default_headers=config.get("default_headers"),
    )
