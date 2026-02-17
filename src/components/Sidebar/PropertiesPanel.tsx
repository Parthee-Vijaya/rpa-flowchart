"use client";
import type { Node } from "@xyflow/react";
import { nodeTypeLabels } from "../NodeTypes";

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
  onDeleteNode: (id: string) => void;
}

export default function PropertiesPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
}: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className="text-sm text-zinc-500 italic px-1">
        Vaelg en node for at redigere
      </div>
    );
  }

  const data = selectedNode.data as Record<string, string>;
  const typeInfo = nodeTypeLabels[selectedNode.type || "process_step"];

  const update = (field: string, value: string) => {
    onUpdateNode(selectedNode.id, { ...data, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {typeInfo?.label || "Node"}
        </h3>
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Slet
        </button>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Titel</label>
        <input
          type="text"
          value={data.label || ""}
          onChange={(e) => update("label", e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Beskrivelse</label>
        <textarea
          value={data.description || ""}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Applikation</label>
        <input
          type="text"
          value={data.application || ""}
          onChange={(e) => update("application", e.target.value)}
          placeholder="fx DUBU, SAPA, Outlook"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Trinnummer</label>
        <input
          type="text"
          value={data.stepNumber || ""}
          onChange={(e) => update("stepNumber", e.target.value)}
          placeholder="fx 1.1, 2.3"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
