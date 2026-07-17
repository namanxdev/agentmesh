"use client";

import { memo, useCallback, type ChangeEvent } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import {
  BaseNode,
  NodeMetaRow,
  getHandleLabelStyle,
  getHandleStyle,
  getTextareaStyle,
} from "./BaseNode";
import { usePipelineStore } from "@/stores/pipelineStore";
import type { PipelineNode, TextNodeConfig } from "@/types/pipeline";

const VARIABLE_REGEX = /\{\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}\}/g;

function extractVariables(content: string): string[] {
  return [...new Set([...content.matchAll(VARIABLE_REGEX)].map((match) => match[1]))];
}

export const TextNode = memo(function TextNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = data.config as TextNodeConfig;
  const updateNodeConfig = usePipelineStore((state) => state.updateNodeConfig);
  const variables = config.variables ?? [];

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const content = event.target.value;
      event.target.style.height = "auto";
      event.target.style.height = `${Math.max(72, event.target.scrollHeight)}px`;
      updateNodeConfig(id, { content, variables: extractVariables(content) });
    },
    [id, updateNodeConfig]
  );

  return (
    <BaseNode id={id} kind="text" label={data.label} selected={Boolean(selected)} hideDefaultHandles>
      <NodeMetaRow>
        <Badge>template</Badge>
        <Badge>{variables.length} var{variables.length === 1 ? "" : "s"}</Badge>
        {variables.map((variable) => <Badge key={variable}>{`{{${variable}}}`}</Badge>)}
      </NodeMetaRow>
      <div>
        <div className="mb-1 text-[10px] font-medium text-neutral-500">Template</div>
        <textarea
          value={config.content}
          onChange={handleChange}
          placeholder="Write prompt text with {{variables}}..."
          className="pipeline-node__textarea nodrag"
          style={getTextareaStyle()}
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="pipeline-node__handle"
        style={getHandleStyle()}
      />
      {variables.map((variable, index) => (
        <Handle
          key={variable}
          id={variable}
          type="target"
          position={Position.Left}
          className="pipeline-node__handle"
          style={getHandleStyle({ top: 88 + index * 24 })}
          title={`{{${variable}}}`}
        >
          <span className="pipeline-node__handle-label" style={getHandleLabelStyle()}>
            {`{{${variable}}}`}
          </span>
        </Handle>
      ))}
    </BaseNode>
  );
});
