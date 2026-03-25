from backend.llm.base import BaseLLMProvider
from backend.events.bus import EventBus
from .base import Agent, AgentConfig, AgentStatus


class AgentRegistry:
    """Central registry: creates and stores Agent instances from configs."""

    def __init__(self, llm_provider: BaseLLMProvider, event_bus: EventBus):
        self._llm = llm_provider
        self._event_bus = event_bus
        self._agents: dict[str, Agent] = {}

    def register(self, config: AgentConfig) -> Agent:
        """Create and store an Agent from its config."""
        agent = Agent(config=config, llm_provider=self._llm, event_bus=self._event_bus)
        self._agents[config.name] = agent
        return agent

    def get(self, name: str) -> Agent:
        if name not in self._agents:
            raise KeyError(f"Agent '{name}' not registered.")
        return self._agents[name]

    def list_all(self) -> list[Agent]:
        return list(self._agents.values())

    def get_status_map(self) -> dict[str, AgentStatus]:
        return {name: agent.status for name, agent in self._agents.items()}
