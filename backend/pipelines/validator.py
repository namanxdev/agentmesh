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
    llm_provider: BaseLLMProvider,
    event_bus: EventBus,
    mcp_registry: MCPRegistry | None = None,
) -> dict:
    """
    Convert a frontend pipeline definition to WorkflowOrchestrator-compatible config.

    Returns:
        {agent_registry, graph_config, task}
    """
    from backend.agents.base import AgentConfig
    from backend.agents.pipeline_nodes import MemoryAgent, TransformAgent
    from backend.agents.registry import AgentRegistry

    # Kinds that participate in the execution graph (have their own graph node).
    EXECUTABLE_KINDS = {"llm_agent", "memory", "transform"}

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
    task = (
        input_nodes[0]["config"].get("description", "Execute pipeline")
        if input_nodes
        else "Execute pipeline"
    )

    # Build fresh AgentRegistry
    agent_registry = AgentRegistry(llm_provider=llm_provider, event_bus=event_bus)

    # Topological sort (Kahn's algorithm)
    in_deg = {n["id"]: 0 for n in nodes}
    for e in edges:
        if e["source"] in in_deg and e["target"] in in_deg:
            in_deg[e["target"]] += 1

    queue = deque(nid for nid, d in in_deg.items() if d == 0)
    topo_order: list[str] = []
    temp_in_deg = dict(in_deg)
    while queue:
        u = queue.popleft()
        topo_order.append(u)
        for v in adj[u]:
            temp_in_deg[v] -= 1
            if temp_in_deg[v] == 0:
                queue.append(v)

    # All nodes that participate in the execution graph, in topo order
    executable_ids = [nid for nid in topo_order if node_map[nid]["kind"] in EXECUTABLE_KINDS]
    llm_agent_ids = [nid for nid in executable_ids if node_map[nid]["kind"] == "llm_agent"]

    # Per-llm_agent data collected from adjacent structural nodes
    mcp_servers_map: dict[str, list[str]] = {nid: [] for nid in llm_agent_ids}
    system_prompt_prefixes: dict[str, str] = {nid: "" for nid in llm_agent_ids}
    handoff_rules_map: dict[str, dict[str, str]] = {nid: {} for nid in llm_agent_ids}

    # Reverse adjacency (for upstream lookups)
    rev_adj: dict[str, list[str]] = {n["id"]: [] for n in nodes}
    for e in edges:
        if e["source"] in rev_adj and e["target"] in rev_adj:
            rev_adj[e["target"]].append(e["source"])

    def find_nearest_llm_agent_upstream(node_id: str) -> str | None:
        """BFS backward to find nearest upstream llm_agent."""
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

    def find_nearest_executable_downstream(node_id: str) -> str | None:
        """BFS forward to find nearest downstream executable node (llm_agent/memory/transform)."""
        visited: set[str] = set()
        q: deque[str] = deque([node_id])
        while q:
            curr = q.popleft()
            if curr in visited:
                continue
            visited.add(curr)
            if curr != node_id and node_map[curr]["kind"] in EXECUTABLE_KINDS:
                return curr
            for child in adj[curr]:
                q.append(child)
        return None

    # For backwards-compat in parallel fan-out (still needs llm_agent specifically)
    def find_nearest_llm_agent_downstream(node_id: str) -> str | None:
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

    # Tool nodes: attach MCP server to the nearest upstream llm_agent
    for n in nodes:
        if n["kind"] == "tool":
            agent_id = find_nearest_llm_agent_upstream(n["id"])
            if agent_id and agent_id in mcp_servers_map:
                server = n["config"].get("server", "")
                if server and server not in mcp_servers_map[agent_id]:
                    mcp_servers_map[agent_id].append(server)

    # Text nodes: prepend content to the nearest downstream llm_agent system_prompt
    for n in nodes:
        if n["kind"] == "text":
            agent_id = find_nearest_llm_agent_downstream(n["id"])
            if agent_id and agent_id in system_prompt_prefixes:
                content = n["config"].get("content", "")
                if content:
                    system_prompt_prefixes[agent_id] = content + "\n\n"

    # Router nodes: populate handoff_rules for the upstream llm_agent and inject
    # a routing instruction into its system prompt so it emits [ROUTE: key].
    for n in nodes:
        if n["kind"] == "router":
            conditions = n["config"].get("conditions", [])
            if not conditions:
                continue
            agent_id = find_nearest_llm_agent_upstream(n["id"])
            if agent_id and agent_id in handoff_rules_map:
                keys = [c["key"] for c in conditions if c.get("key")]
                for key in keys:
                    handoff_rules_map[agent_id][key] = key
                # Inject routing instruction into system prompt suffix
                key_list = " | ".join(f'"{k}"' for k in keys)
                routing_instruction = (
                    f"\n\nAt the end of your response you MUST output exactly one routing tag "
                    f"on its own line to direct the workflow. Choose from: {key_list}. "
                    f"Format: [ROUTE: chosen_key]"
                )
                system_prompt_prefixes[agent_id] = (
                    system_prompt_prefixes[agent_id] + routing_instruction
                    if system_prompt_prefixes[agent_id]
                    else routing_instruction
                )

    # Register all executable nodes in the registry
    for nid in executable_ids:
        n = node_map[nid]
        kind = n["kind"]
        cfg = n["config"]

        if kind == "llm_agent":
            system_prompt = system_prompt_prefixes[nid] + cfg.get("system_prompt", "")
            agent_config = AgentConfig(
                name=cfg.get("name", nid),
                role="agent",
                system_prompt=system_prompt,
                model=cfg.get("model", "gemini-2.0-flash"),
                temperature=float(cfg.get("temperature", 0.7)),
                mcp_servers=mcp_servers_map[nid],
                handoff_rules=handoff_rules_map[nid],
            )
            agent_registry.register(agent_config)

            # Wire up MCP clients
            if mcp_registry:
                agent = agent_registry.get(agent_config.name)
                for server_name in agent_config.mcp_servers:
                    try:
                        client = mcp_registry.get_client(server_name)
                        agent.register_mcp_client(server_name, client)
                    except (KeyError, Exception):
                        pass

        elif kind == "memory":
            mem_agent = MemoryAgent(
                name=cfg.get("key", nid),  # use key as the node's identity name
                key=cfg.get("key", "memory"),
                memory_type=cfg.get("memory_type", "context"),
                event_bus=event_bus,
            )
            agent_registry.register_instance(mem_agent)

        elif kind == "transform":
            tr_agent = TransformAgent(
                name=nid,  # node id as identity (transforms are anonymous)
                transform_type=cfg.get("transform_type", "json_parse"),
                expression=cfg.get("expression", ""),
                event_bus=event_bus,
            )
            agent_registry.register_instance(tr_agent)

    # Helper: get the execution name for a node id
    def exec_name(nid: str) -> str:
        n = node_map[nid]
        kind = n["kind"]
        cfg = n.get("config", {})
        if kind == "llm_agent":
            return cfg.get("name", nid)
        if kind == "memory":
            return cfg.get("key", nid)
        return nid  # transform uses node id

    # Build graph_config from all executable nodes
    graph_config: dict = {}
    exec_names = [exec_name(nid) for nid in executable_ids]

    if not exec_names:
        return {"agent_registry": agent_registry, "graph_config": {}, "task": task}

    # Starting nodes: executable nodes with no upstream executable node
    executable_id_set = set(executable_ids)
    has_upstream_exec: set[str] = set()
    for nid in executable_ids:
        for target in adj[nid]:
            if target in executable_id_set:
                has_upstream_exec.add(exec_name(target))

    start_nodes = [name for name in exec_names if name not in has_upstream_exec]
    graph_config["start"] = start_nodes[0] if len(start_nodes) == 1 else start_nodes

    for nid in executable_ids:
        name = exec_name(nid)
        downstream = adj[nid]

        # Router nodes connected directly downstream
        router_nodes = [node_map[d] for d in downstream if node_map[d]["kind"] == "router"]
        # Parallel fan-out nodes connected directly downstream
        parallel_nodes = [node_map[d] for d in downstream if node_map[d]["kind"] == "parallel"]

        if router_nodes:
            router = router_nodes[0]
            transitions: dict[str, str] = {}
            for cond in router["config"].get("conditions", []):
                target_id = cond.get("target", "")
                # Resolve target name: look for any executable node with that name
                target_node = next(
                    (
                        nd
                        for nd in nodes
                        if nd["kind"] in EXECUTABLE_KINDS
                        and (
                            nd["config"].get("name", nd["id"]) == target_id
                            or nd["config"].get("key", nd["id"]) == target_id
                            or nd["id"] == target_id
                        )
                    ),
                    None,
                )
                transitions[cond["key"]] = exec_name(target_node["id"]) if target_node else "end"
            graph_config[name] = transitions

        elif parallel_nodes:
            parallel_node = parallel_nodes[0]
            branch_names: list[str] = []
            for branch_target in adj[parallel_node["id"]]:
                branch_node = node_map[branch_target]
                if branch_node["kind"] in EXECUTABLE_KINDS:
                    branch_names.append(exec_name(branch_target))
                else:
                    further = find_nearest_executable_downstream(branch_target)
                    if further:
                        branch_names.append(exec_name(further))

            if len(branch_names) >= 2:
                graph_config[name] = {"on_complete": branch_names}
            elif len(branch_names) == 1:
                graph_config[name] = {"on_complete": branch_names[0]}
            else:
                graph_config[name] = {"on_complete": "end"}

        else:
            # Find next executable node downstream
            next_exec_id = None
            for d in downstream:
                if node_map[d]["kind"] in EXECUTABLE_KINDS:
                    next_exec_id = d
                    break
                elif node_map[d]["kind"] == "output":
                    pass  # maps to end
                else:
                    further = find_nearest_executable_downstream(d)
                    if further:
                        next_exec_id = further
                        break

            if next_exec_id:
                graph_config[name] = {"on_complete": exec_name(next_exec_id)}
            else:
                graph_config[name] = {"on_complete": "end"}

    return {
        "agent_registry": agent_registry,
        "graph_config": graph_config,
        "task": task,
    }
