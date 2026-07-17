from .base import BaseLLMProvider, LLMResponse
from .catalog import provider_for_model


class MultiProvider(BaseLLMProvider):
    """Route each model to the matching client in the shared provider catalog."""

    def __init__(self, providers: dict[str, BaseLLMProvider]):
        self._providers = providers

    def _select(self, model: str) -> BaseLLMProvider:
        try:
            provider_id = provider_for_model(model)
        except ValueError as exc:
            raise RuntimeError(str(exc)) from exc

        provider = self._providers.get(provider_id)
        if provider is None:
            raise RuntimeError(
                f"No API key saved for provider '{provider_id}' (needed for model '{model}'). "
                "Go to Settings and add your API key."
            )
        return provider

    async def generate(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str = "gemini-2.5-flash",
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
