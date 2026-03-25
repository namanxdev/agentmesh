"use client";
import { useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import { useEventStore } from "@/stores/eventStore";
import type { AgentMeshEvent } from "@/types/events";

function isAgentMeshEvent(data: unknown): data is AgentMeshEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    "id" in data &&
    "timestamp" in data &&
    "workflow_id" in data
  );
}

export function useAgentMeshEvents(enabled = true) {
  const addEvent = useEventStore((s) => s.addEvent);

  const handleMessage = useCallback(
    (data: unknown) => {
      if (isAgentMeshEvent(data)) addEvent(data);
    },
    [addEvent]
  );

  const { send } = useWebSocket({ onMessage: handleMessage, enabled });
  return { send };
}
