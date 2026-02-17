"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface DataInputData {
  label: string;
  description?: string;
  application?: string;
  stepNumber?: string;
  screenshotUrl?: string;
}

export default function DataInputNode({
  data,
  selected,
}: NodeProps & { data: DataInputData }) {
  return (
    <div
      className={`min-w-[220px] max-w-[300px] rounded-lg border-2 bg-zinc-900 p-3 transition-shadow ${
        selected
          ? "border-green-400 shadow-lg shadow-green-500/20"
          : "border-green-600"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-green-500 !border-green-400"
      />

      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-green-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          {data.application && (
            <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">
              {data.application}
            </span>
          )}
        </div>
        {data.stepNumber && (
          <span className="text-[10px] text-zinc-500 shrink-0">
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

      {data.screenshotUrl && (
        <img
          src={data.screenshotUrl}
          alt=""
          className="mt-2 w-full rounded border border-zinc-700 object-cover"
          style={{ maxHeight: 80 }}
        />
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-green-500 !border-green-400"
      />
    </div>
  );
}
