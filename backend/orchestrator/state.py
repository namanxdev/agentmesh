from pydantic import BaseModel, Field


class WorkflowState(BaseModel):
    """Shared mutable state passed between all agents in a workflow run."""

    current_task: str
    shared_data: dict = Field(default_factory=dict)
    messages: list[dict] = Field(default_factory=list)
    token_usage: dict[str, dict] = Field(default_factory=dict)
    last_agent: str = ""
    routing_key: str = "on_complete"

    model_config = {"arbitrary_types_allowed": True}


class WorkflowResult(BaseModel):
    """Final output of a completed workflow run."""

    state: WorkflowState
    success: bool = True
    error: str | None = None
    total_duration: float = 0.0

    @property
    def total_tokens(self) -> int:
        return sum(u.get("input", 0) + u.get("output", 0) for u in self.state.token_usage.values())

    model_config = {"arbitrary_types_allowed": True}
