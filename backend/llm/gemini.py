import asyncio
import random

from google import genai
from google.genai import types

from .base import BaseLLMProvider, LLMResponse

# Base delays between retries on 429. Jitter added at runtime to prevent
# synchronized retries across concurrent agents in a workflow.
_RETRY_DELAYS = [8, 20, 45, 60]

# Retired Gemini model IDs → current replacements (saved pipelines may still store old names).
_MODEL_ALIASES = {
    "gemini-2.0-flash": "gemini-2.5-flash",
    "gemini-2.0-pro": "gemini-2.5-pro",
    "models/gemini-2.0-flash": "gemini-2.5-flash",
    "models/gemini-2.0-pro": "gemini-2.5-pro",
}

# JSON-Schema keywords that google.genai's Schema type rejects. MCP servers emit
# full JSON Schema (draft-07) — e.g. Context7/DeepWiki include "$schema" — but
# Gemini's FunctionDeclaration only accepts the OpenAPI subset. Any extra key
# raises a pydantic "extra_forbidden" error, so strip these recursively.
_UNSUPPORTED_SCHEMA_KEYS = frozenset(
    {
        "additionalProperties",
        "patternProperties",
        "unevaluatedProperties",
        "additionalItems",
        "definitions",
        "dependencies",
        "dependentSchemas",
        "dependentRequired",
        "if",
        "then",
        "else",
        "not",
        "const",
        "examples",
    }
)


def _sanitize_schema(schema):
    """Recursively drop JSON-Schema-only keys that Gemini's Schema rejects.

    Removes any ``$``-prefixed key ($schema, $id, $ref, $defs) and the
    unsupported keywords above, recursing through ``properties``/``items``/
    ``anyOf`` etc. so nested tool-parameter schemas are cleaned too.
    """
    if isinstance(schema, dict):
        return {
            key: _sanitize_schema(value)
            for key, value in schema.items()
            if not key.startswith("$") and key not in _UNSUPPORTED_SCHEMA_KEYS
        }
    if isinstance(schema, list):
        return [_sanitize_schema(item) for item in schema]
    return schema


class GeminiProvider(BaseLLMProvider):
    """Gemini LLM provider (Gemini 2.5 Flash)."""

    def __init__(self, api_key: str):
        self._client = genai.Client(api_key=api_key)

    async def generate(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        model = _MODEL_ALIASES.get(model, model)
        last_exc = None
        for attempt, delay in enumerate([0] + _RETRY_DELAYS):
            if delay:
                await asyncio.sleep(delay + random.uniform(0, delay * 0.3))
            try:
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
            except Exception as exc:
                # Retry on quota/rate-limit errors (429 RESOURCE_EXHAUSTED)
                if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                    last_exc = exc
                    continue
                raise
        raise last_exc

    def _format_messages(self, messages: list[dict]) -> list[types.Content]:
        result = []
        for msg in messages:
            role = "user" if msg["role"] in ("user", "tool") else "model"
            result.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=str(msg.get("content", "")))],
                )
            )
        return result

    def _format_tools(self, tools: list[dict]) -> list[types.Tool]:
        declarations = [
            types.FunctionDeclaration(
                name=t["function"]["name"],
                description=t["function"].get("description", ""),
                parameters=_sanitize_schema(t["function"].get("parameters")),
            )
            for t in tools
        ]
        return [types.Tool(function_declarations=declarations)]

    def _parse_response(self, response) -> LLMResponse:
        if not response.candidates:
            raise ValueError("LLM returned no candidates")
        text, tool_calls = "", []
        for part in response.candidates[0].content.parts:
            if part.function_call and part.function_call.name:
                tool_calls.append(
                    {"name": part.function_call.name, "args": dict(part.function_call.args)}
                )
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
