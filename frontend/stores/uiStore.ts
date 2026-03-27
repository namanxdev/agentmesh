import { create } from "zustand";

export type InspectorTab = "tools" | "agent" | "tokens" | "output";
export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

interface UIStore {
  selectedAgent: string | null;
  inspectorTab: InspectorTab;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  activeWorkflowName: string | null;

  selectAgent: (name: string | null) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setActiveWorkflow: (name: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedAgent: null,
  inspectorTab: "output",
  connectionStatus: "idle",
  isConnected: false,
  activeWorkflowName: null,

  selectAgent: (name) => set({ selectedAgent: name }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),
  setConnectionStatus: (status) =>
    set({ connectionStatus: status, isConnected: status === "connected" }),
  setActiveWorkflow: (name) => set({ activeWorkflowName: name }),
}));
