"""Handoff routing: maps (agent_name, routing_key) → next node."""


class HandoffRouter:
    """Resolves which agent runs next based on routing_key from agent output.

    Transition values may be a string (single next node) or a list of strings
    (parallel fan-out to multiple agents simultaneously).
    """

    def __init__(self, graph_config: dict[str, dict[str, str | list[str]]]):
        # graph_config: {"AgentName": {"on_complete": "NextAgent", ...}}
        # List values are passed through to support parallel fan-out:
        # {"AgentA": {"on_complete": ["AgentB", "AgentC"]}}
        self._graph = graph_config

    def next_node(self, agent_name: str, routing_key: str) -> str | list[str]:
        """
        Return next node name (or list of names) for given agent + routing key.
        Falls back to 'on_complete' if the specific key isn't found.
        Raises KeyError if the agent has no config at all.

        When a list is returned, the caller is responsible for running all
        branches concurrently (parallel fan-out).
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
