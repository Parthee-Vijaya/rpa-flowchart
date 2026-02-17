"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface AppSwitchData {
  label: string;
  description?: string;
  application?: string;
  stepNumber?: string;
}

export default function ApplicationSwitchNode({
  data,
  selected,
}: NodeProps & { data: AppSwitchData }) {
  return (
    <div
      className={`min-w-[220px] max-w-[300px] rounded-lg border-2 bg-zinc-900 p-3 transition-shadow ${
        selected
          ? "border-purple-400 shadow-lg shadow-purple-500/20"
          : "border-purple-600"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-purple-400"
      />

      <div className="flex items-center gap-2 mb-1">
        <svg
          className="w-4 h-4 text-purple-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        {data.application && (
          <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded">
            {data.application}
          </span>
        )}
        {data.stepNumber && (
          <span className="text-[10px] text-zinc-500 ml-auto">
            {data.stepNumber}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-white leading-tight">
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
        className="!w-3 !h-3 !bg-purple-500 !border-purple-400"
      />
    </div>
  );
}
