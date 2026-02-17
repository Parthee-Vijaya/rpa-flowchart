"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuid } from "uuid";
import { nodeTypes } from "./NodeTypes";
import NodePalette from "./Sidebar/NodePalette";
import PropertiesPanel from "./Sidebar/PropertiesPanel";
import UploadPanel from "./UploadPanel";
import AIPanel from "./AIPanel";
import Toolbar from "./Toolbar";
import SettingsPanel from "./SettingsPanel";
import ColorLegend from "./ColorLegend";
import SwimlaneBackgrounds from "./SwimlaneBackgrounds";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { applySwimlaneLayout, getSwimlaneBackgrounds } from "@/lib/layout";
import type { AiGeneratedFlowchart, ParsedSlide, RpaNode, RpaEdge } from "@/lib/types";

interface FlowchartEditorProps {
  projectId: string;
  projectName: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

function FlowchartEditorInner({
  projectId,
  projectName,
  initialNodes,
  initialEdges,
}: FlowchartEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"palette" | "properties" | "upload">("upload");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [text, setText] = useState("");
  const [screenshots, setScreenshots] = useState<Array<{ url: string; base64: string; mediaType: string }>>([]);
  const [pptxSlides, setPptxSlides] = useState<ParsedSlide[]>([]);
  const [swimlaneData, setSwimlaneData] = useState<
    Array<{ application: string; x: number; y: number; width: number; height: number }>
  >([]);

  const { fitView, screenToFlowPosition } = useReactFlow();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(
    initialNodes,
    initialEdges
  );

  // Compute swimlane backgrounds from current nodes
  const swimlaneBackgrounds = useMemo(() => {
    if (swimlaneData.length > 0) return swimlaneData;

    // Try to compute from existing nodes if they have applications
    const apps = new Map<string, { minY: number; maxY: number; x: number }>();
    for (const node of nodes) {
      const data = node.data as Record<string, string>;
      const app = data.application || (node.type === "start_end" ? "Proces" : "");
      if (!app) continue;
      const existing = apps.get(app);
      if (existing) {
        existing.minY = Math.min(existing.minY, node.position.y);
        existing.maxY = Math.max(existing.maxY, node.position.y + 100);
        existing.x = Math.min(existing.x, node.position.x);
      } else {
        apps.set(app, {
          minY: node.position.y,
          maxY: node.position.y + 100,
          x: node.position.x,
        });
      }
    }

    if (apps.size <= 1) return [];

    return Array.from(apps.entries()).map(([app, info]) => ({
      application: app,
      x: info.x - 60,
      y: info.minY - 60,
      width: 350,
      height: info.maxY - info.minY + 180,
    }));
  }, [nodes, swimlaneData]);

  // Auto-save debounced
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      }).catch(console.error);
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo(nodes, edges, setNodes, setEdges);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo(nodes, edges, setNodes, setEdges);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nodes, edges, undo, redo, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      takeSnapshot(nodes, edges);
      setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds));
    },
    [nodes, edges, takeSnapshot, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/rpa-node-type");
      if (!type) return;

      takeSnapshot(nodes, edges);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: uuid(),
        type,
        position,
        data: { label: "Nyt trin", description: "" },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, edges, takeSnapshot, screenToFlowPosition, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSidebarTab("properties");
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onUpdateNode = useCallback(
    (id: string, data: Record<string, unknown>) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
      );
      setSelectedNode((prev) =>
        prev?.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev
      );
    },
    [nodes, edges, takeSnapshot, setNodes]
  );

  const onDeleteNode = useCallback(
    (id: string) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNode(null);
    },
    [nodes, edges, takeSnapshot, setNodes, setEdges]
  );

  const onGenerated = useCallback(
    (result: AiGeneratedFlowchart) => {
      takeSnapshot(nodes, edges);

      // Apply swimlane layout
      const { nodes: layoutNodes, swimlanes } = applySwimlaneLayout(
        result.nodes as RpaNode[],
        result.edges as RpaEdge[]
      );

      // Calculate max Y for swimlane backgrounds
      const maxY = layoutNodes.reduce(
        (max, n) => Math.max(max, n.position.y),
        0
      );
      const backgrounds = getSwimlaneBackgrounds(swimlanes, maxY + 150);
      setSwimlaneData(backgrounds);

      setNodes(layoutNodes as unknown as Node[]);
      setEdges(result.edges as unknown as Edge[]);
      setTimeout(() => fitView({ padding: 0.15 }), 150);
    },
    [nodes, edges, takeSnapshot, setNodes, setEdges, fitView]
  );

  const handlePptxImport = useCallback(
    (slides: ParsedSlide[]) => {
      setPptxSlides(slides);
      const textParts = slides
        .filter((s) => s.textContent.trim())
        .map((s) => `Slide ${s.slideNumber} (${s.title}):\n${s.textContent}`);
      setText(textParts.join("\n\n"));

      const allImages: Array<{ url: string; base64: string; mediaType: string }> = [];
      for (const slide of slides) {
        for (const img of slide.images) {
          allImages.push({
            url: "",
            base64: img.data,
            mediaType: img.contentType,
          });
        }
      }
      setScreenshots(allImages.length > 20 ? allImages.slice(0, 20) : allImages);
    },
    []
  );

  const nodeColorMap: Record<string, string> = {
    process_step: "#2563eb",
    decision: "#eab308",
    application_switch: "#9333ea",
    data_input: "#16a34a",
    blocker: "#dc2626",
    start_end: "#71717a",
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <a href="/" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
              RPA Flow
            </a>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
              title="AI-indstillinger"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <h2 className="text-sm text-zinc-400 truncate">{projectName}</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {[
            { key: "upload", label: "Upload" },
            { key: "palette", label: "Noder" },
            { key: "properties", label: "Egenskaber" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSidebarTab(tab.key as typeof sidebarTab)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                sidebarTab === tab.key
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === "upload" && (
            <div className="space-y-4">
              <UploadPanel
                projectId={projectId}
                onImagesUploaded={(imgs) =>
                  setScreenshots((prev) => [...prev, ...imgs])
                }
                onPptxImported={handlePptxImport}
                onTextChange={setText}
                text={text}
              />
              <AIPanel
                projectId={projectId}
                screenshots={screenshots}
                textDescription={text}
                onGenerated={onGenerated}
              />
              {pptxSlides.length > 0 && (
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 mb-1">
                    Importeret: {pptxSlides.length} slides, {screenshots.length} billeder
                  </p>
                </div>
              )}
            </div>
          )}
          {sidebarTab === "palette" && <NodePalette />}
          {sidebarTab === "properties" && (
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={onUpdateNode}
              onDeleteNode={onDeleteNode}
            />
          )}
        </div>
      </div>

      {/* Flow canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            takeSnapshot(nodes, edges);
            onNodesChange(changes);
          }}
          onEdgesChange={(changes) => {
            takeSnapshot(nodes, edges);
            onEdgesChange(changes);
          }}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{ type: "smoothstep", animated: false }}
          className="bg-zinc-950"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#27272a" gap={20} />
          <SwimlaneBackgrounds swimlanes={swimlaneBackgrounds} />
          <Controls className="bg-zinc-900 border border-zinc-700" />
          <MiniMap
            className="bg-zinc-900 border border-zinc-700"
            nodeColor={(node) => nodeColorMap[node.type || ""] || "#71717a"}
            maskColor="rgba(0,0,0,0.7)"
          />
          <Panel position="top-center">
            <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg px-3 py-1.5">
              <Toolbar
                projectName={projectName}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={() => undo(nodes, edges, setNodes, setEdges)}
                onRedo={() => redo(nodes, edges, setNodes, setEdges)}
                onFitView={() => fitView({ padding: 0.15 })}
              />
            </div>
          </Panel>
          <Panel position="bottom-left">
            <ColorLegend />
          </Panel>
        </ReactFlow>
      </div>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function FlowchartEditor(props: FlowchartEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowchartEditorInner {...props} />
    </ReactFlowProvider>
  );
}
