"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface BlockerData {
  label: string;
  description?: string;
  stepNumber?: string;
}

export default function BlockerNode({
  data,
  selected,
}: NodeProps & { data: BlockerData }) {
  return (
    <div
      className={`min-w-[220px] max-w-[300px] rounded-lg border-2 border-dashed bg-zinc-900 p-3 transition-shadow ${
        selected
          ? "border-red-400 shadow-lg shadow-red-500/20"
          : "border-red-600"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-red-500 !border-red-400"
      />

      <div className="flex items-center gap-2 mb-1">
        <svg
          className="w-4 h-4 text-red-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span className="text-[10px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">
          Bloker
        </span>
        {data.stepNumber && (
          <span className="text-[10px] text-zinc-500 ml-auto">
            {data.stepNumber}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-red-300 leading-tight">
        {data.label}
      </p>

      {data.description && (
        <p className="text-xs text-zinc-400 leading-relaxed mt-1">
          {data.description}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-red-500 !border-red-400"
      />
    </div>
  );
}
