"""Pipeline DAG validation and conversion utilities."""
from __future__ import annotations

from collections import deque
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.events.bus import EventBus
    from backend.llm.base import BaseLLMProvider
    from backend.mcp.registry import MCPRegistry


def validate_pipeline(nodes: list[dict], edges: list[dict]) -> dict:
    """
    Validate a pipeline definition.

    Returns:
        {num_nodes, num_edges, is_dag, errors[]}
    """
    errors = []
    node_ids = {n["id"] for n in nodes}

    # Structural checks
    input_nodes = [n for n in nodes if n["kind"] == "input"]
    output_nodes = [n for n in nodes if n["kind"] == "output"]

    if len(input_nodes) != 1:
        errors.append(f"Expected exactly 1 input node, found {len(input_nodes)}")
    if len(output_nodes) != 1:
        errors.append(f"Expected exactly 1 output node, found {len(output_nodes)}")

    # Build adjacency list and in-degree map
    adj: dict[str, list[str]] = {nid: [] for nid in node_ids}
    in_degree: dict[str, int] = {nid: 0 for nid in node_ids}

    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]
        if src not in node_ids or tgt not in node_ids:
            errors.append(f"Edge '{edge['id']}' references unknown node")
            continue
        adj[src].append(tgt)
        in_degree[tgt] += 1

    # Kahn's topological sort for cycle detection
    queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
    visited = 0
    while queue:
        u = queue.popleft()
        visited += 1
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    is_dag = visited == len(node_ids)
    if not is_dag:
        errors.append("Cycle detected: pipeline graph is not a DAG")

    # Connectivity checks (only if no cycles)
    if is_dag and len(node_ids) > 0:
        outgoing_count = {nid: len(adj[nid]) for nid in node_ids}
        incoming_count = {nid: 0 for nid in node_ids}
        for edge in edges:
            if edge["source"] in node_ids and edge["target"] in node_ids:
                incoming_count[edge["target"]] += 1

        for n in nodes:
            nid = n["id"]
            kind = n["kind"]
            if kind != "input" and incoming_count[nid] == 0:
                errors.append(f"Node '{nid}' ({kind}) has no incoming edges")
            if kind != "output" and outgoing_count[nid] == 0:
                errors.append(f"Node '{nid}' ({kind}) has no outgoing edges")
            if kind == "router" and outgoing_count[nid] < 2:
                errors.append(f"Router node '{nid}' must have at least 2 outgoing edges")
            if kind == "parallel" and outgoing_count[nid] < 2:
                errors.append(f"Parallel node '{nid}' must have at least 2 outgoing edges")

    return {
        "num_nodes": len(nodes),
        "num_edges": len(edges),
        "is_dag": is_dag and len(errors) == 0,
        "errors": errors,
    }


def pipeline_to_workflow_config(
    definition: dict,
    llm_provider: "BaseLLMProvider",
    event_bus: "EventBus",
    mcp_registry: "MCPRegistry | None" = None,
) -> dict:
    """
    Convert a frontend pipeline definition to WorkflowOrchestrator-compatible config.

    Returns:
        {agent_registry, graph_config, task}
    """
    from backend.agents.base import AgentConfig
    from backend.agents.registry import AgentRegistry

    nodes = definition["nodes"]
    edges = definition["edges"]

    # Build adjacency for traversal
    adj: dict[str, list[str]] = {n["id"]: [] for n in nodes}
    for edge in edges:
        if edge["source"] in adj:
            adj[edge["source"]].append(edge["target"])

    node_map = {n["id"]: n for n in nodes}

    # Extract task from input node
    input_nodes = [n for n in nodes if n["kind"] == "input"]
    task = input_nodes[0]["config"].get("description", "Execute pipeline") if input_nodes else "Execute pipeline"

    # Build fresh AgentRegistry
    agent_registry = AgentRegistry(llm_provider=llm_provider, event_bus=event_bus)

    # Find all llm_agent nodes in topological order
    # Simple topo sort using Kahn's
    in_deg = {n["id"]: 0 for n in nodes}
    for e in edges:
        if e["source"] in in_deg and e["target"] in in_deg:
            in_deg[e["target"]] += 1

    queue = deque(nid for nid, d in in_deg.items() if d == 0)
    topo_order = []
    temp_in_deg = dict(in_deg)
    while queue:
        u = queue.popleft()
        topo_order.append(u)
        for v in adj[u]:
            temp_in_deg[v] -= 1
            if temp_in_deg[v] == 0:
                queue.append(v)

    llm_agent_ids = [nid for nid in topo_order if node_map[nid]["kind"] == "llm_agent"]

    # Collect mcp_servers from tool nodes per downstream llm_agent
    mcp_servers_map: dict[str, list[str]] = {nid: [] for nid in llm_agent_ids}
    system_prompt_prefixes: dict[str, str] = {nid: "" for nid in llm_agent_ids}

    def find_nearest_llm_agent_upstream(node_id: str) -> str | None:
        """BFS backward to find nearest upstream llm_agent."""
        rev_adj: dict[str, list[str]] = {n["id"]: [] for n in nodes}
        for e in edges:
            if e["source"] in rev_adj and e["target"] in rev_adj:
                rev_adj[e["target"]].append(e["source"])
        visited: set[str] = set()
        q: deque[str] = deque([node_id])
        while q:
            curr = q.popleft()
            if curr in visited:
                continue
            visited.add(curr)
            if curr != node_id and node_map[curr]["kind"] == "llm_agent":
                return curr
            for parent in rev_adj[curr]:
                q.append(parent)
        return None

    def find_nearest_llm_agent_downstream(node_id: str) -> str | None:
        """BFS forward to find nearest downstream llm_agent."""
        visited: set[str] = set()
        q: deque[str] = deque([node_id])
        while q:
            curr = q.popleft()
            if curr in visited:
                continue
            visited.add(curr)
            if curr != node_id and node_map[curr]["kind"] == "llm_agent":
                return curr
            for child in adj[curr]:
                q.append(child)
        return None

    # Process tool nodes (attach to upstream llm_agent)
    for n in nodes:
        if n["kind"] == "tool":
            agent_id = find_nearest_llm_agent_upstream(n["id"])
            if agent_id and agent_id in mcp_servers_map:
                server = n["config"].get("server", "")
                if server and server not in mcp_servers_map[agent_id]:
                    mcp_servers_map[agent_id].append(server)

    # Process text nodes (prepend to downstream llm_agent system_prompt)
    for n in nodes:
        if n["kind"] == "text":
            agent_id = find_nearest_llm_agent_downstream(n["id"])
            if agent_id and agent_id in system_prompt_prefixes:
                content = n["config"].get("content", "")
                if content:
                    system_prompt_prefixes[agent_id] = content + "\n\n"

    # Register llm_agent nodes as AgentConfig
    for nid in llm_agent_ids:
        n = node_map[nid]
        cfg = n["config"]
        system_prompt = system_prompt_prefixes[nid] + cfg.get("system_prompt", "")
        agent_config = AgentConfig(
            name=cfg.get("name", nid),
            role="agent",
            system_prompt=system_prompt,
            model=cfg.get("model", "gemini-2.0-flash"),
            temperature=float(cfg.get("temperature", 0.7)),
            mcp_servers=mcp_servers_map[nid],
            handoff_rules={},
        )
        agent_registry.register(agent_config)

        # Inject MCP clients into agent
        if mcp_registry:
            agent = agent_registry.get(agent_config.name)
            for server_name in agent_config.mcp_servers:
                try:
                    client = mcp_registry.get_client(server_name)
                    agent.register_mcp_client(server_name, client)
                except (KeyError, Exception):
                    pass  # server not configured — tools will gracefully fail

    # Build graph_config
    graph_config: dict = {}
    agent_names = [node_map[nid]["config"].get("name", nid) for nid in llm_agent_ids]

    if not agent_names:
        return {"agent_registry": agent_registry, "graph_config": {}, "task": task}

    # Determine which llm_agents are starting nodes (no upstream llm_agent).
    # Agents that ARE targets of other llm_agents have an upstream agent and are
    # not starts.  All remaining agents run first — in parallel if there are
    # multiple, sequentially if there is exactly one.
    llm_agent_id_set = set(llm_agent_ids)
    has_upstream_agent: set[str] = set()
    for nid in llm_agent_ids:
        for target in adj[nid]:
            if target in llm_agent_id_set:
                has_upstream_agent.add(node_map[target]["config"].get("name", target))

    start_agents = [name for name in agent_names if name not in has_upstream_agent]
    graph_config["start"] = start_agents[0] if len(start_agents) == 1 else start_agents

    for i, nid in enumerate(llm_agent_ids):
        agent_name = node_map[nid]["config"].get("name", nid)
        downstream = adj[nid]

        # Check if next is a router
        router_nodes = [node_map[d] for d in downstream if node_map[d]["kind"] == "router"]
        # Check if next is a parallel fan-out node
        parallel_nodes = [node_map[d] for d in downstream if node_map[d]["kind"] == "parallel"]

        if router_nodes:
            router = router_nodes[0]
            transitions: dict[str, str] = {}
            for cond in router["config"].get("conditions", []):
                target_id = cond.get("target", "")
                # Find the llm_agent with that name
                target_node = next(
                    (n for n in nodes if n["kind"] == "llm_agent" and n["config"].get("name", n["id"]) == target_id),
                    None,
                )
                if target_node:
                    transitions[cond["key"]] = target_id
                else:
                    transitions[cond["key"]] = "end"
            graph_config[agent_name] = transitions
        elif parallel_nodes:
            # Fan-out: collect all llm_agents reachable directly from the parallel node.
            parallel_node = parallel_nodes[0]
            branch_agent_names: list[str] = []
            for branch_target in adj[parallel_node["id"]]:
                branch_node = node_map[branch_target]
                if branch_node["kind"] == "llm_agent":
                    branch_agent_names.append(branch_node["config"].get("name", branch_target))
                else:
                    # Traverse through structural nodes to find the first llm_agent.
                    further = find_nearest_llm_agent_downstream(branch_target)
                    if further:
                        branch_agent_names.append(node_map[further]["config"].get("name", further))

            if len(branch_agent_names) >= 2:
                graph_config[agent_name] = {"on_complete": branch_agent_names}
            elif len(branch_agent_names) == 1:
                # Degenerate parallel with one branch — treat as sequential.
                graph_config[agent_name] = {"on_complete": branch_agent_names[0]}
            else:
                graph_config[agent_name] = {"on_complete": "end"}
        else:
            # Find next llm_agent downstream
            next_llm_id = None
            for d in downstream:
                if node_map[d]["kind"] == "llm_agent":
                    next_llm_id = d
                    break
                elif node_map[d]["kind"] == "output":
                    pass  # will map to end
                else:
                    # skip non-agent nodes, look further
                    further = find_nearest_llm_agent_downstream(d)
                    if further:
                        next_llm_id = further
                        break

            if next_llm_id:
                next_name = node_map[next_llm_id]["config"].get("name", next_llm_id)
                graph_config[agent_name] = {"on_complete": next_name}
            else:
                graph_config[agent_name] = {"on_complete": "end"}

    return {
        "agent_registry": agent_registry,
        "graph_config": graph_config,
        "task": task,
    }
