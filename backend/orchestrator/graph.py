import asyncio
import time
import uuid

from backend.events.bus import EventBus

from .handoff import HandoffRouter
from .state import WorkflowResult, WorkflowState


class ParallelBranchError(RuntimeError):
    """Raised when one or more parallel branches fail.

    Carries the names of the agents whose branch raised so the workflow error
    event can report the real failing agent(s) rather than a stringified list
    of the whole parallel branch.
    """

    def __init__(self, message: str, failed_agents: list[str]):
        super().__init__(message)
        self.failed_agents = failed_agents


class WorkflowOrchestrator:
    """
    Runs a multi-agent workflow as a sequential state machine, with optional
    parallel fan-out when a transition value is a list of agent names.

    Sequential example (graph_config):
        {"start": "A", "A": {"on_complete": "B"}, "B": {"on_complete": "end"}}

    Parallel fan-out / fan-in example:
        {
          "start": "A",
          "A": {"on_complete": ["B", "C"]},
          "B": {"on_complete": "D"},
          "C": {"on_complete": "D"},
          "D": {"on_complete": "end"},
        }
    When next_node is a list, all branches run concurrently via asyncio.gather().
    Each branch receives a copy of shared_data.  After all branches complete their
    results are merged (last-write-wins per key) and the workflow continues from
    the join node — the first on_complete target that all parallel branches agree
    on (typically the same next agent for every branch).

    Emits workflow and agent events via EventBus.
    """

    def __init__(
        self,
        agents: dict,
        graph_config: dict,
        event_bus: EventBus,
        workflow_id: str | None = None,
        max_iterations: int = 20,
        timeout_seconds: float = 120.0,
    ):
        self._agents = agents
        self._router = HandoffRouter({k: v for k, v in graph_config.items() if k != "start"})
        self._start = graph_config["start"]
        self._event_bus = event_bus
        self.workflow_id = workflow_id or f"wf_{uuid.uuid4().hex[:8]}"
        self._max_iterations = max_iterations
        self._timeout = timeout_seconds
        # Tracks the node currently being processed so run()'s except handler can
        # report the failing agent even though the loop lives in _execute().
        self._current_node: str | list[str] = self._start

    async def _run_agent(
        self,
        agent_name: str,
        state: WorkflowState,
        branch_shared_data: dict,
    ) -> tuple[str, object]:
        """Run a single agent and return (agent_name, AgentResult)."""
        agent = self._agents.get(agent_name)
        if agent is None:
            raise KeyError(f"Agent '{agent_name}' not found in workflow.")

        result = await agent.process(
            task=state.current_task,
            state=branch_shared_data,
            workflow_id=self.workflow_id,
        )
        return agent_name, result

    async def _execute(self, state: WorkflowState, start_time: float) -> None:
        """Drive the state machine from the start node to 'end', mutating `state`.

        Extracted from run() so the whole loop can be wrapped in
        asyncio.wait_for() — that gives a hard wall-clock timeout which also
        cancels in-flight provider retry backoffs (asyncio.sleep) instead of
        only being checked between iterations.
        """
        current_node: str | list[str] = self._start
        iterations = 0

        while current_node != "end":
            self._current_node = current_node
            if iterations >= self._max_iterations:
                raise RuntimeError(
                    f"Max iterations ({self._max_iterations}) exceeded. "
                    f"Last agent: {current_node}"
                )
            # Cheap per-iteration guard; the hard limit is enforced by
            # asyncio.wait_for() in run(), which also interrupts mid-agent sleeps.
            if time.time() - start_time > self._timeout:
                raise TimeoutError(f"Workflow timeout ({self._timeout}s) exceeded.")

            # --- Parallel fan-out branch ---
            if isinstance(current_node, list):
                branch_names = current_node

                await self._event_bus.emit(
                    {
                        "type": "agent.parallel_start",
                        "workflow_id": self.workflow_id,
                        "agents": branch_names,
                    }
                )

                # Each branch gets an independent snapshot of shared_data.
                # return_exceptions keeps every sibling running to completion
                # even when one raises, so no orphaned tasks emit events after
                # the workflow has already reported an error.
                branch_tasks = [
                    self._run_agent(name, state, state.shared_data.copy())
                    for name in branch_names
                ]
                results = await asyncio.gather(*branch_tasks, return_exceptions=True)

                # Fan-in: merge successful branches; collect failures to report.
                # gather preserves order, so pair each result with its branch.
                join_node: str | list[str] | None = None
                failed_agents: list[str] = []
                failure_details: list[str] = []
                for branch_name, outcome in zip(branch_names, results):
                    if isinstance(outcome, Exception):
                        failed_agents.append(branch_name)
                        failure_details.append(
                            f"{branch_name} ({type(outcome).__name__}: {outcome})"
                        )
                        continue

                    _, result = outcome
                    state.messages.append(
                        {
                            "agent": branch_name,
                            "content": result.output,
                            "timestamp": time.time(),
                        }
                    )
                    state.token_usage[branch_name] = result.token_usage
                    if result.state_updates:
                        state.shared_data.update(result.state_updates)

                    # Determine join node from the first successful branch's
                    # next_node.  All branches in a well-formed parallel section
                    # should point to the same join node.
                    candidate = self._router.next_node(branch_name, result.routing_key)
                    if join_node is None:
                        join_node = candidate

                if failed_agents:
                    # Skip agent.parallel_complete — workflow.error covers it.
                    raise ParallelBranchError(
                        "Parallel agent(s) failed: " + ", ".join(failure_details),
                        failed_agents,
                    )

                if not branch_names:
                    raise ValueError("Parallel branch cannot be empty")
                state.last_agent = branch_names[-1]
                state.routing_key = "on_complete"

                await self._event_bus.emit(
                    {
                        "type": "agent.parallel_complete",
                        "workflow_id": self.workflow_id,
                        "agents": branch_names,
                        "joinNode": join_node,
                    }
                )

                current_node = join_node if join_node is not None else "end"

            # --- Sequential branch (existing behaviour, unchanged) ---
            else:
                agent = self._agents.get(current_node)
                if agent is None:
                    raise KeyError(f"Agent '{current_node}' not found in workflow.")

                result = await agent.process(
                    task=state.current_task,
                    state=state.shared_data,
                    workflow_id=self.workflow_id,
                )

                state.messages.append(
                    {
                        "agent": current_node,
                        "content": result.output,
                        "timestamp": time.time(),
                    }
                )
                state.token_usage[current_node] = result.token_usage
                state.last_agent = current_node
                state.routing_key = result.routing_key

                if result.state_updates:
                    state.shared_data.update(result.state_updates)

                next_node = self._router.next_node(current_node, result.routing_key)

                if next_node != "end":
                    await self._event_bus.emit(
                        {
                            "type": "agent.handoff",
                            "workflow_id": self.workflow_id,
                            "fromAgent": current_node,
                            "toAgent": next_node,
                            "reason": result.routing_key,
                        }
                    )

                current_node = next_node

            iterations += 1

    async def run(self, task: str, initial_state: dict | None = None) -> WorkflowResult:
        """Execute the workflow from start node to 'end' node."""
        state = WorkflowState(
            current_task=task,
            shared_data=initial_state or {},
        )

        await self._event_bus.emit(
            {
                "type": "workflow.started",
                "workflow_id": self.workflow_id,
                "agents": list(self._agents.keys()),
                "task": task,
            }
        )

        start_time = time.time()
        self._current_node = self._start

        try:
            # Hard wall-clock timeout: wait_for cancels _execute (and any
            # in-flight retry backoff sleep) once self._timeout elapses.
            await asyncio.wait_for(self._execute(state, start_time), timeout=self._timeout)

        except TimeoutError:
            # asyncio.TimeoutError is TimeoutError on 3.11+; both the wait_for
            # cancellation and our per-iteration check land here.  str() of an
            # asyncio TimeoutError is empty, so use an explicit message.  The
            # last active node is the best-known culprit for the timeout.
            error_msg = f"Workflow timeout ({self._timeout}s) exceeded."
            failed = state.last_agent or self._start
            await self._event_bus.emit(
                {
                    "type": "workflow.error",
                    "workflow_id": self.workflow_id,
                    "error": error_msg,
                    "failedAgent": failed,
                }
            )
            return WorkflowResult(
                state=state,
                success=False,
                error=error_msg,
                total_duration=time.time() - start_time,
            )

        except Exception as exc:
            if isinstance(exc, ParallelBranchError):
                failed = ", ".join(exc.failed_agents)
            else:
                failed = (
                    self._current_node
                    if isinstance(self._current_node, str)
                    else str(self._current_node)
                )
            await self._event_bus.emit(
                {
                    "type": "workflow.error",
                    "workflow_id": self.workflow_id,
                    "error": str(exc),
                    "failedAgent": failed,
                }
            )
            return WorkflowResult(
                state=state,
                success=False,
                error=str(exc),
                total_duration=time.time() - start_time,
            )

        total_duration = time.time() - start_time
        total_tokens = sum(
            u.get("input", 0) + u.get("output", 0) for u in state.token_usage.values()
        )

        await self._event_bus.emit(
            {
                "type": "workflow.completed",
                "workflow_id": self.workflow_id,
                "result": state.messages[-1] if state.messages else {},
                "totalTokens": total_tokens,
                "duration": total_duration,
            }
        )

        return WorkflowResult(
            state=state,
            success=True,
            total_duration=total_duration,
        )
