"""Handoff routing: maps (agent_name, routing_key) → next node."""


class HandoffRouter:
    """Resolves which agent runs next based on routing_key from agent output."""

    def __init__(self, graph_config: dict[str, dict[str, str]]):
        # graph_config: {"AgentName": {"on_complete": "NextAgent", ...}}
        self._graph = graph_config

    def next_node(self, agent_name: str, routing_key: str) -> str:
        """
        Return next node name for given agent + routing key.
        Falls back to 'on_complete' if the specific key isn't found.
        Raises KeyError if the agent has no config at all.
        """
        if agent_name not in self._graph:
            raise KeyError(f"Agent '{agent_name}' has no transitions in graph config.")

        transitions = self._graph[agent_name]
        if routing_key in transitions:
            return transitions[routing_key]
        # Fall back to on_complete
        if "on_complete" in transitions:
            return transitions["on_complete"]
        # No transitions at all
        return "end"

    def all_agents(self) -> list[str]:
        return list(self._graph.keys())
