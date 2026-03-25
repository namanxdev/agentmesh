import time
import uuid
from typing import Optional
from backend.agents.base import AgentConfig
from backend.events.bus import EventBus
from .state import WorkflowState, WorkflowResult
from .handoff import HandoffRouter


class WorkflowOrchestrator:
    """
    Runs a multi-agent workflow as a sequential state machine.
    Agents execute one at a time; routing_key determines the next agent.
    Emits workflow and agent events via EventBus.
    """

    def __init__(
        self,
        agents: dict,
        graph_config: dict,
        event_bus: EventBus,
        workflow_id: Optional[str] = None,
        max_iterations: int = 20,
        timeout_seconds: float = 120.0,
    ):
        self._agents = agents
        self._router = HandoffRouter(
            {k: v for k, v in graph_config.items() if k != "start"}
        )
        self._start = graph_config["start"]
        self._event_bus = event_bus
        self.workflow_id = workflow_id or f"wf_{uuid.uuid4().hex[:8]}"
        self._max_iterations = max_iterations
        self._timeout = timeout_seconds

    async def run(
        self, task: str, initial_state: Optional[dict] = None
    ) -> WorkflowResult:
        """Execute the workflow from start node to 'end' node."""
        state = WorkflowState(
            current_task=task,
            shared_data=initial_state or {},
        )

        await self._event_bus.emit({
            "type": "workflow.started",
            "workflow_id": self.workflow_id,
            "agents": list(self._agents.keys()),
            "task": task,
        })

        start_time = time.time()
        current_node = self._start
        iterations = 0

        try:
            while current_node != "end":
                if iterations >= self._max_iterations:
                    raise RuntimeError(
                        f"Max iterations ({self._max_iterations}) exceeded. "
                        f"Last agent: {current_node}"
                    )
                if time.time() - start_time > self._timeout:
                    raise TimeoutError(
                        f"Workflow timeout ({self._timeout}s) exceeded."
                    )

                agent = self._agents.get(current_node)
                if agent is None:
                    raise KeyError(f"Agent '{current_node}' not found in workflow.")

                result = await agent.process(
                    task=state.current_task,
                    state=state.shared_data,
                    workflow_id=self.workflow_id,
                )

                state.messages.append({
                    "agent": current_node,
                    "content": result.output,
                    "timestamp": time.time(),
                })
                state.token_usage[current_node] = result.token_usage
                state.last_agent = current_node
                state.routing_key = result.routing_key

                if result.state_updates:
                    state.shared_data.update(result.state_updates)

                next_node = self._router.next_node(current_node, result.routing_key)

                if next_node != "end":
                    await self._event_bus.emit({
                        "type": "agent.handoff",
                        "workflow_id": self.workflow_id,
                        "fromAgent": current_node,
                        "toAgent": next_node,
                        "reason": result.routing_key,
                    })

                current_node = next_node
                iterations += 1

        except Exception as exc:
            await self._event_bus.emit({
                "type": "workflow.error",
                "workflow_id": self.workflow_id,
                "error": str(exc),
                "failedAgent": current_node,
            })
            return WorkflowResult(
                state=state,
                success=False,
                error=str(exc),
                total_duration=time.time() - start_time,
            )

        total_duration = time.time() - start_time
        total_tokens = sum(
            u.get("input", 0) + u.get("output", 0)
            for u in state.token_usage.values()
        )

        await self._event_bus.emit({
            "type": "workflow.completed",
            "workflow_id": self.workflow_id,
            "result": state.messages[-1] if state.messages else {},
            "totalTokens": total_tokens,
            "duration": total_duration,
        })

        return WorkflowResult(
            state=state,
            success=True,
            total_duration=total_duration,
        )
