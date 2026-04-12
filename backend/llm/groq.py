import json
from typing import Optional
from groq import AsyncGroq
from .base import BaseLLMProvider, LLMResponse


class GroqProvider(BaseLLMProvider):
    """Groq LLM provider (Llama 3.3 70B)."""

    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)

    async def generate(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        model: str = "llama-3.3-70b-versatile",
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

        response = await self.client.chat.completions.create(**kwargs)
        return self._parse_response(response)

    def _parse_response(self, response) -> LLMResponse:
        if not response.choices:
            raise ValueError("LLM returned no choices")
        msg = response.choices[0].message
        tool_calls = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                tool_calls.append({
                    "name": tc.function.name,
                    "args": json.loads(tc.function.arguments),
                })
        return LLMResponse(
            text=msg.content or "",
            tool_calls=tool_calls,
            usage={
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
            },
        )
