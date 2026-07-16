"use client";

import { useAgentMeshEvents } from "@/hooks/useAgentMeshEvents";

/**
 * Mounts useAgentMeshEvents(true) globally for the entire dashboard shell so
 * real-time events are received regardless of which sub-route is active.
 */
export function DashboardEventProvider() {
  useAgentMeshEvents(true);
  return null;
}
