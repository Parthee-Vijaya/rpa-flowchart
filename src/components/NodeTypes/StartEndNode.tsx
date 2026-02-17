"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface StartEndData {
  label: string;
  isStartNode?: boolean;
}

export default function StartEndNode({
  data,
  selected,
}: NodeProps & { data: StartEndData }) {
  const isStart = data.isStartNode !== false && data.label?.toLowerCase().includes("start");

  return (
    <div
      className={`min-w-[160px] rounded-full border-2 bg-zinc-900 px-6 py-3 text-center transition-shadow ${
        selected
          ? "border-zinc-300 shadow-lg shadow-white/10"
          : "border-zinc-500"
      }`}
    >
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-zinc-400 !border-zinc-300"
        />
      )}

      <p className="text-sm font-bold text-white">{data.label}</p>

      {isStart && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-zinc-400 !border-zinc-300"
        />
      )}
      {!isStart && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-zinc-400 !border-zinc-300"
        />
      )}
    </div>
  );
}
