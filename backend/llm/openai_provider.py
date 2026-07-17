import json

from openai import AsyncOpenAI

from .base import BaseLLMProvider, LLMResponse


class OpenAIProvider(BaseLLMProvider):
    """OpenAI chat-completions provider and compatible API adapter."""

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        default_headers: dict[str, str] | None = None,
    ):
        client_options: dict = {"api_key": api_key}
        if base_url:
            client_options["base_url"] = base_url
        if default_headers:
            client_options["default_headers"] = default_headers
        self._client = AsyncOpenAI(**client_options)

    async def generate(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        kwargs: dict = dict(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self._client.chat.completions.create(**kwargs)
        return self._parse_response(response)

    def _parse_response(self, response) -> LLMResponse:
        if not response.choices:
            raise ValueError("LLM returned no choices")
        msg = response.choices[0].message
        tool_calls = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                tool_calls.append(
                    {
                        "name": tc.function.name,
                        "args": json.loads(tc.function.arguments),
                    }
                )
        return LLMResponse(
            text=msg.content or "",
            tool_calls=tool_calls,
            usage={
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
            },
        )
