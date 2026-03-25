from typing import Optional
import google.generativeai as genai
from .base import BaseLLMProvider, LLMResponse


class GeminiProvider(BaseLLMProvider):
    """Gemini LLM provider (Gemini 2.0 Flash)."""

    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)

    async def generate(
        self,
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        model: str = "gemini-2.0-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        gen_model = genai.GenerativeModel(model)
        response = await gen_model.generate_content_async(
            contents=self._format_messages(messages),
            tools=self._format_tools(tools) if tools else None,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return self._parse_response(response)

    def _format_messages(self, messages: list[dict]) -> list[dict]:
        result = []
        for msg in messages:
            role = "user" if msg["role"] in ("user", "tool") else "model"
            result.append({"role": role, "parts": [{"text": str(msg.get("content", ""))}]})
        return result

    def _format_tools(self, tools: list[dict]) -> list:
        declarations = [
            genai.protos.FunctionDeclaration(
                name=t["function"]["name"],
                description=t["function"].get("description", ""),
                parameters=t["function"].get("parameters", {}),
            )
            for t in tools
        ]
        return [genai.protos.Tool(function_declarations=declarations)]

    def _parse_response(self, response) -> LLMResponse:
        text, tool_calls = "", []
        for part in response.parts:
            fc = part.function_call
            if fc and fc.name:
                tool_calls.append({"name": fc.name, "args": dict(fc.args)})
            elif hasattr(part, "text"):
                text += part.text
        return LLMResponse(
            text=text,
            tool_calls=tool_calls,
            usage={
                "input": response.usage_metadata.prompt_token_count,
                "output": response.usage_metadata.candidates_token_count,
            },
        )
