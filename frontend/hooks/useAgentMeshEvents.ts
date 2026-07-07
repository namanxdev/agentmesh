"use client";
import { useCallback, useRef } from "react";
import toast from "react-hot-toast";
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
  const lastSeqRef = useRef<Map<string, number>>(new Map());

  const handleMessage = useCallback(
    (data: unknown) => {
      if (!isAgentMeshEvent(data)) return;

      if (typeof data.seq === "number") {
        const map = lastSeqRef.current;
        const prev = map.get(data.workflow_id);
        if (prev !== undefined && data.seq > prev + 1) {
          toast("Reconnected — some earlier events may be missing from this run", {
            id: "ws-gap",
            icon: "⚠️",
            duration: 6000,
          });
        }
        map.set(data.workflow_id, Math.max(prev ?? 0, data.seq));
      }

      addEvent(data);
      if (data.type === "workflow.error") {
        const isNoKey =
          data.error.includes("no_keys") ||
          data.error.includes("No API keys") ||
          data.error.includes("RESOURCE_EXHAUSTED") ||
          data.error.includes("API key");
        toast.error(
          isNoKey
            ? "No API key — add yours in Settings"
            : `Workflow error: ${data.failedAgent}`,
          { duration: 6000 }
        );
      }
    },
    [addEvent]
  );

  const { send } = useWebSocket({ onMessage: handleMessage, enabled });
  return { send };
}
