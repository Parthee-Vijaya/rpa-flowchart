"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface DecisionData {
  label: string;
  description?: string;
  decisionQuestion?: string;
  stepNumber?: string;
}

export default function DecisionNode({
  data,
  selected,
}: NodeProps & { data: DecisionData }) {
  return (
    <div
      className={`min-w-[180px] max-w-[240px] rounded-lg border-2 bg-zinc-900 p-3 transition-shadow ${
        selected
          ? "border-yellow-400 shadow-lg shadow-yellow-500/20"
          : "border-yellow-500"
      }`}
      style={{
        clipPath:
          "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        padding: "32px 24px",
        minHeight: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-yellow-500 !border-yellow-400"
      />

      <div className="text-center">
        {data.stepNumber && (
          <span className="text-[10px] text-zinc-500 block mb-1">
            {data.stepNumber}
          </span>
        )}
        <p className="text-sm font-semibold text-white leading-tight">
          {data.label}
        </p>
        {data.description && (
          <p className="text-[10px] text-zinc-400 mt-1">{data.description}</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!w-3 !h-3 !bg-green-500 !border-green-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        className="!w-3 !h-3 !bg-red-500 !border-red-400"
      />
    </div>
  );
}
