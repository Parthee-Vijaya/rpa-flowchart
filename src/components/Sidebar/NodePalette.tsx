"use client";
import { nodeTypeLabels } from "../NodeTypes";

const colorMap: Record<string, string> = {
  blue: "border-blue-600 bg-blue-950/30 text-blue-300",
  yellow: "border-yellow-500 bg-yellow-950/30 text-yellow-300",
  purple: "border-purple-600 bg-purple-950/30 text-purple-300",
  green: "border-green-600 bg-green-950/30 text-green-300",
  red: "border-red-600 bg-red-950/30 text-red-300",
  zinc: "border-zinc-500 bg-zinc-800/30 text-zinc-300",
};

export default function NodePalette() {
  const onDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/rpa-node-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
        Nodetyper
      </h3>
      {Object.entries(nodeTypeLabels).map(([type, { label, color }]) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          className={`border rounded-md px-3 py-2 cursor-grab active:cursor-grabbing text-sm font-medium transition-colors hover:brightness-125 ${colorMap[color] || colorMap.zinc}`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
