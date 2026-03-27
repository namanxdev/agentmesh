import { create } from "zustand";
import type { AgentMeshEvent, AgentStatus } from "@/types/events";

export interface AgentRuntimeState {
  status: AgentStatus;
  current_task?: string;
  token_input: number;
  token_output: number;
  last_updated: number;
}

interface EventStore {
  events: AgentMeshEvent[];
  agentStates: Record<string, AgentRuntimeState>;
  workflowId: string | null;
  workflowStatus: "idle" | "running" | "completed" | "error";
  totalTokens: number;
  lastOutput: string | null;

  addEvent: (event: AgentMeshEvent) => void;
  setWorkflowId: (id: string | null) => void;
  reset: () => void;
}

const INITIAL: Pick<EventStore, "events" | "agentStates" | "workflowId" | "workflowStatus" | "totalTokens" | "lastOutput"> = {
  events: [],
  agentStates: {},
  workflowId: null,
  workflowStatus: "idle",
  totalTokens: 0,
  lastOutput: null,
};

export const useEventStore = create<EventStore>((set) => ({
  ...INITIAL,

  addEvent: (event) =>
    set((state) => {
      if (state.events.some((e) => e.id === event.id)) return state;
      const next: Partial<EventStore> = {
        events: [...state.events, event],
      };

      if (event.type === "workflow.started") {
        next.workflowStatus = "running";
        next.workflowId = event.workflow_id;
      } else if (event.type === "workflow.completed") {
        next.workflowStatus = "completed";
        next.totalTokens = event.totalTokens;
      } else if (event.type === "workflow.error") {
        next.workflowStatus = "error";
      } else if (event.type === "agent.activated") {
        next.agentStates = {
          ...state.agentStates,
          [event.agentName]: {
            status: "active",
            current_task: event.taskDescription,
            token_input: state.agentStates[event.agentName]?.token_input ?? 0,
            token_output: state.agentStates[event.agentName]?.token_output ?? 0,
            last_updated: Date.now(),
          },
        };
      } else if (event.type === "agent.thinking") {
        const existing = state.agentStates[event.agentName];
        if (existing) {
          next.agentStates = {
            ...state.agentStates,
            [event.agentName]: { ...existing, status: "thinking", last_updated: Date.now() },
          };
        }
      } else if (event.type === "agent.completed") {
        const existing = state.agentStates[event.agentName];
        if (existing) {
          next.agentStates = {
            ...state.agentStates,
            [event.agentName]: {
              ...existing,
              status: "completed",
              current_task: undefined,
              last_updated: Date.now(),
            },
          };
        }
        if (event.output) next.lastOutput = event.output;
      } else if (event.type === "token.usage") {
        const existing = state.agentStates[event.agentName] ?? {
          status: "idle" as AgentStatus,
          token_input: 0,
          token_output: 0,
          last_updated: Date.now(),
        };
        const updated = { ...existing, token_input: event.input, token_output: event.output };
        const newStates = { ...state.agentStates, [event.agentName]: updated };
        next.agentStates = newStates;
        next.totalTokens = Object.values(newStates).reduce(
          (sum, a) => sum + a.token_input + a.token_output,
          0
        );
      }

      return next as EventStore;
    }),

  setWorkflowId: (id) => set({ workflowId: id }),

  reset: () => set(INITIAL),
}));
