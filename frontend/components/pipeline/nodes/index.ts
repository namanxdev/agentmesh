import { InputNode } from "./InputNode";
import { OutputNode } from "./OutputNode";
import { LLMAgentNode } from "./LLMAgentNode";
import { ToolNode } from "./ToolNode";
import { TextNode } from "./TextNode";
import { RouterNode } from "./RouterNode";
import { MemoryNode } from "./MemoryNode";
import { TransformNode } from "./TransformNode";

// IMPORTANT: Declared outside any React component for stable reference (React Flow requirement)
export const pipelineNodeTypes = {
  input: InputNode,
  output: OutputNode,
  llm_agent: LLMAgentNode,
  tool: ToolNode,
  text: TextNode,
  router: RouterNode,
  memory: MemoryNode,
  transform: TransformNode,
} as const;

export {
  InputNode,
  OutputNode,
  LLMAgentNode,
  ToolNode,
  TextNode,
  RouterNode,
  MemoryNode,
  TransformNode,
};
export { BaseNode, NODE_COLORS, NODE_ICONS } from "./BaseNode";
