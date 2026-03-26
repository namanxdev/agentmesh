from typing import Optional
from google import genai
from google.genai import types
from .base import BaseLLMProvider, LLMResponse


class GeminiProvider(BaseLLMProvider):
    """Gemini LLM provider (Gemini 2.0 Flash)."""

    def __init__(self, api_key: str):
        self._client = genai.Client(api_key=api_key)

    async def generate(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        model: str = "gemini-2.0-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        response = await self._client.aio.models.generate_content(
            model=model,
            contents=self._format_messages(messages),
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                tools=self._format_tools(tools) if tools else None,
            ),
        )
        return self._parse_response(response)

    def _format_messages(self, messages: list[dict]) -> list[types.Content]:
        result = []
        for msg in messages:
            role = "user" if msg["role"] in ("user", "tool") else "model"
            result.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=str(msg.get("content", "")))],
            ))
        return result

    def _format_tools(self, tools: list[dict]) -> list[types.Tool]:
        declarations = [
            types.FunctionDeclaration(
                name=t["function"]["name"],
                description=t["function"].get("description", ""),
                parameters=t["function"].get("parameters"),
            )
            for t in tools
        ]
        return [types.Tool(function_declarations=declarations)]

    def _parse_response(self, response) -> LLMResponse:
        text, tool_calls = "", []
        for part in response.candidates[0].content.parts:
            if part.function_call and part.function_call.name:
                tool_calls.append({"name": part.function_call.name, "args": dict(part.function_call.args)})
            elif part.text:
                text += part.text
        return LLMResponse(
            text=text,
            tool_calls=tool_calls,
            usage={
                "input": response.usage_metadata.prompt_token_count,
                "output": response.usage_metadata.candidates_token_count,
            },
        )
