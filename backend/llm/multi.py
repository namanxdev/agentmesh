from .base import BaseLLMProvider, LLMResponse


class MultiProvider(BaseLLMProvider):
    """
    Routes LLM calls to the correct provider based on model name prefix.

    providers: dict mapping family name to provider instance.
      - "gemini"  → any model starting with "gemini"
      - "openai"  → any model starting with "gpt" or "o1" or "o3"
      - "groq"    → everything else (llama, mixtral, etc.)

    If a required provider is missing, raises RuntimeError with a clear message.
    """

    def __init__(self, providers: dict[str, BaseLLMProvider]):
        self._providers = providers

    def _select(self, model: str) -> BaseLLMProvider:
        model_lower = model.lower()
        if model_lower.startswith("gemini"):
            family = "gemini"
        elif model_lower.startswith(("gpt", "o1", "o3", "o4")):
            family = "openai"
        else:
            family = "groq"

        provider = self._providers.get(family)
        if provider is None:
            raise RuntimeError(
                f"No API key saved for provider '{family}' (needed for model '{model}'). "
                "Go to Settings and add your API key."
            )
        return provider

    async def generate(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str = "gemini-2.0-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        return await self._select(model).generate(
            messages=messages,
            tools=tools,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
