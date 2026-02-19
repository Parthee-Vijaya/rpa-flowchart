"use client";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

interface ToolbarProps {
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  showDependencies: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  onToggleDependencies: () => void;
}

export default function Toolbar({
  projectName,
  canUndo,
  canRedo,
  showDependencies,
  onUndo,
  onRedo,
  onFitView,
  onToggleDependencies,
}: ToolbarProps) {
  const getFlowElement = () =>
    document.querySelector(".react-flow__viewport") as HTMLElement | null;

  const exportPng = async () => {
    const el = getFlowElement();
    if (!el) return;

    const dataUrl = await toPng(el, {
      backgroundColor: "#09090b",
      quality: 0.95,
      pixelRatio: 2,
    });

    const link = document.createElement("a");
    link.download = `${projectName}-flowchart.png`;
    link.href = dataUrl;
    link.click();
  };

  const exportPdf = async () => {
    const el = getFlowElement();
    if (!el) return;

    const dataUrl = await toPng(el, {
      backgroundColor: "#09090b",
      pixelRatio: 2,
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => (img.onload = resolve));

    const pdf = new jsPDF({
      orientation: img.width > img.height ? "landscape" : "portrait",
      unit: "px",
      format: [img.width / 2, img.height / 2],
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, img.width / 2, img.height / 2);
    pdf.save(`${projectName}-flowchart.pdf`);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 rounded hover:bg-zinc-700 disabled:opacity-30 transition-colors"
        title="Fortryd (Ctrl+Z)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 rounded hover:bg-zinc-700 disabled:opacity-30 transition-colors"
        title="Gentag (Ctrl+Y)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <button
        onClick={onFitView}
        className="p-2 rounded hover:bg-zinc-700 transition-colors"
        title="Tilpas visning"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <button
        onClick={onToggleDependencies}
        className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
          showDependencies
            ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
        }`}
        title="Vis/skjul afhængighedslabels"
      >
        Afh.
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <button
        onClick={exportPng}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PNG
      </button>

      <button
        onClick={exportPdf}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PDF
      </button>
    </div>
  );
}
