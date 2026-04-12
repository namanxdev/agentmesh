from abc import ABC, abstractmethod

from pydantic import BaseModel, Field, model_validator


class LLMResponse(BaseModel):
    """Response from any LLM provider."""

    text: str = ""
    tool_calls: list[dict] = Field(default_factory=list)
    has_tool_calls: bool = False
    usage: dict = Field(default_factory=lambda: {"input": 0, "output": 0})

    @model_validator(mode="after")
    def _set_has_tool_calls(self) -> "LLMResponse":
        self.has_tool_calls = len(self.tool_calls) > 0
        return self


class BaseLLMProvider(ABC):
    """Abstract base for all LLM providers."""

    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        pass
