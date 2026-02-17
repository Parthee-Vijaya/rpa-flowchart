"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ProcessStepData {
  label: string;
  description?: string;
  application?: string;
  stepNumber?: string;
  screenshotUrl?: string;
}

export default function ProcessStepNode({
  data,
  selected,
}: NodeProps & { data: ProcessStepData }) {
  return (
    <div
      className={`min-w-[220px] max-w-[300px] rounded-lg border-2 bg-zinc-900 p-3 transition-shadow ${
        selected
          ? "border-blue-400 shadow-lg shadow-blue-500/20"
          : "border-blue-600"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-blue-400"
      />

      <div className="flex items-start justify-between gap-2 mb-1">
        {data.application && (
          <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded shrink-0">
            {data.application}
          </span>
        )}
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
        className="!w-3 !h-3 !bg-blue-500 !border-blue-400"
      />
    </div>
  );
}
