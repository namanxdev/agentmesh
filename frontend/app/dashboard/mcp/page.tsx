import { Server } from "lucide-react";

export const metadata = {
  title: "MCP Registry - AgentMesh",
  description: "Manage your registered MCP servers",
};

export default function McpPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-neutral-800 bg-neutral-900 p-2 text-neutral-400">
            <Server className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">MCP Registry</h1>
        </div>
        <p className="text-sm text-neutral-500">
          Browse, register, and manage your MCP servers. Full registry management UI will appear here.
        </p>
      </div>
    </div>
  );
}
