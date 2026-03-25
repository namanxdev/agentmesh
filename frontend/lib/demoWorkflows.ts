export interface WorkflowConfig {
  name: string;
  description: string;
  agents: string[];
  edges: Array<{ from: string; to: string }>;
}

export const DEMO_WORKFLOWS: Record<string, WorkflowConfig> = {
  "github-code-review": {
    name: "github-code-review",
    description: "Multi-agent code review pipeline",
    agents: ["Fetcher", "Reviewer", "SecurityScanner", "Summarizer"],
    edges: [
      { from: "Fetcher", to: "Reviewer" },
      { from: "Reviewer", to: "SecurityScanner" },
      { from: "SecurityScanner", to: "Summarizer" },
    ],
  },
  "research-synthesis": {
    name: "research-synthesis",
    description: "Web research + synthesis pipeline",
    agents: ["Searcher", "Extractor", "Analyst", "Writer"],
    edges: [
      { from: "Searcher", to: "Extractor" },
      { from: "Extractor", to: "Analyst" },
      { from: "Analyst", to: "Writer" },
    ],
  },
};
