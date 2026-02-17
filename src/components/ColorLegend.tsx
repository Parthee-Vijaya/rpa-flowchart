"use client";

const legend = [
  { type: "process_step", label: "Procestrin", color: "bg-blue-600", border: "border-blue-600" },
  { type: "decision", label: "Beslutning", color: "bg-yellow-500", border: "border-yellow-500" },
  { type: "application_switch", label: "Skift applikation", color: "bg-purple-600", border: "border-purple-600" },
  { type: "data_input", label: "Datainput / kopiering", color: "bg-green-600", border: "border-green-600" },
  { type: "blocker", label: "Bloker / spørgsmål", color: "bg-red-600", border: "border-red-600" },
  { type: "start_end", label: "Start / Slut", color: "bg-zinc-500", border: "border-zinc-500" },
];

export default function ColorLegend() {
  return (
    <div className="bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-lg p-3 shadow-xl">
      <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Farveforklaring
      </h4>
      <div className="space-y-1.5">
        {legend.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-sm ${item.color} shrink-0`}
            />
            <span className="text-xs text-zinc-300">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
