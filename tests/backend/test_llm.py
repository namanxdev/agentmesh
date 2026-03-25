import pytest
from backend.llm.base import LLMResponse, BaseLLMProvider


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
