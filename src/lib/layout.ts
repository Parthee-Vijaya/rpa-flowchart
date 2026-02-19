import type { RpaNode, RpaEdge } from "./types";

const SWIMLANE_WIDTH = 560;
const SWIMLANE_GAP = 95;
const NODE_VERTICAL_SPACING = 155;
const GROUP_VERTICAL_GAP = 120;
const HEADER_HEIGHT = 64;
const PADDING_X = 70;
const PADDING_Y = 30;

interface SwimlaneInfo {
  application: string;
  columnIndex: number;
  x: number;
  nodes: RpaNode[];
}

export interface SectionInfo {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function applySwimlaneLayout(
  nodes: RpaNode[],
  edges: RpaEdge[]
): {
  nodes: RpaNode[];
  swimlanes: SwimlaneInfo[];
  sections: SectionInfo[];
  bounds: { maxX: number; maxY: number };
} {
  if (nodes.length === 0) {
    return { nodes, swimlanes: [], sections: [], bounds: { maxX: 0, maxY: 0 } };
  }

  // 1. Determine execution order from edges
  const ordered = getExecutionOrder(nodes, edges);

  // 2. Group consecutive nodes by application
  const groups = groupByApplication(ordered);
  const sections = buildSections(ordered);

  // 3. Assign swimlane columns (unique apps get their own column)
  const appOrder: string[] = [];
  for (const group of groups) {
    if (!appOrder.includes(group.app)) {
      appOrder.push(group.app);
    }
  }

  const swimlanes: SwimlaneInfo[] = appOrder.map((app, i) => ({
    application: app,
    columnIndex: i,
    x: i * (SWIMLANE_WIDTH + SWIMLANE_GAP),
    nodes: [],
  }));

  const swimlaneMap = new Map<string, SwimlaneInfo>();
  for (const sl of swimlanes) {
    swimlaneMap.set(sl.application, sl);
  }

  // 4. Position nodes within each vertical swimlane
  const swimlaneY = new Map<string, number>();
  for (const app of appOrder) {
    swimlaneY.set(app, HEADER_HEIGHT + PADDING_Y);
  }

  const repositionedNodes: RpaNode[] = [];

  for (const group of groups) {
    const sl = swimlaneMap.get(group.app)!;
    const currentY = swimlaneY.get(group.app)!;

    for (let i = 0; i < group.nodes.length; i++) {
      const node = { ...group.nodes[i] };
      const y = currentY + i * NODE_VERTICAL_SPACING;

      node.position = {
        x: sl.x + PADDING_X,
        y,
      };

      repositionedNodes.push(node);
      sl.nodes.push(node);
    }

    const endY = currentY + group.nodes.length * NODE_VERTICAL_SPACING;
    swimlaneY.set(group.app, endY + GROUP_VERTICAL_GAP);
  }

  const positionedById = new Map(repositionedNodes.map((n) => [n.id, n]));
  const groupedSections: SectionInfo[] = sections
    .map((section, index) => {
      const positioned = section.nodes
        .map((n) => positionedById.get(n.id))
        .filter((n): n is RpaNode => Boolean(n));
      if (positioned.length === 0) return null;

      const minX = Math.min(...positioned.map((n) => n.position.x));
      const maxX = Math.max(...positioned.map((n) => n.position.x));
      const minY = Math.min(...positioned.map((n) => n.position.y));
      const maxY = Math.max(...positioned.map((n) => n.position.y));

      return {
        id: `section-${index}`,
        label: section.label,
        x: minX - 54,
        y: minY - 64,
        width: maxX - minX + 320,
        height: maxY - minY + 180,
      };
    })
    .filter((s): s is SectionInfo => Boolean(s));

  const maxX = repositionedNodes.reduce((max, n) => Math.max(max, n.position.x), 0);
  const maxY = repositionedNodes.reduce((max, n) => Math.max(max, n.position.y), 0);

  return {
    nodes: repositionedNodes,
    swimlanes,
    sections: groupedSections,
    bounds: { maxX, maxY },
  };
}

interface NodeGroup {
  app: string;
  nodes: RpaNode[];
}

function groupByApplication(nodes: RpaNode[]): NodeGroup[] {
  const groups: NodeGroup[] = [];
  let currentApp = "";
  let currentGroup: RpaNode[] = [];

  for (const node of nodes) {
    const app = node.data.application || getAppFromType(node);

    if (app !== currentApp && currentGroup.length > 0) {
      groups.push({ app: currentApp, nodes: currentGroup });
      currentGroup = [];
    }
    currentApp = app;
    currentGroup.push(node);
  }

  if (currentGroup.length > 0) {
    groups.push({ app: currentApp, nodes: currentGroup });
  }

  return groups;
}

interface SectionGroup {
  key: string;
  label: string;
  nodes: RpaNode[];
}

function buildSections(nodes: RpaNode[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let currentKey = "";
  let currentGroup: RpaNode[] = [];

  for (const node of nodes) {
    const key = getSectionKey(node, groups.length + 1);
    if (key !== currentKey && currentGroup.length > 0) {
      groups.push({
        key: currentKey,
        label: deriveSectionTitle(currentGroup, groups.length + 1),
        nodes: currentGroup,
      });
      currentGroup = [];
    }
    currentKey = key;
    currentGroup.push(node);
  }

  if (currentGroup.length > 0) {
    groups.push({
      key: currentKey || `section-${groups.length + 1}`,
      label: deriveSectionTitle(currentGroup, groups.length + 1),
      nodes: currentGroup,
    });
  }

  return groups;
}

function getSectionKey(node: RpaNode, fallbackIndex: number): string {
  const step = node.data.stepNumber?.trim();
  if (step) {
    const major = step.split(".")[0];
    if (/^\d+$/.test(major)) {
      return `step-major-${major}`;
    }
  }
  return `section-${fallbackIndex}`;
}

function deriveSectionTitle(nodes: RpaNode[], fallbackIndex: number): string {
  const candidates = nodes
    .map((n) => `${n.data.label || ""} ${n.data.description || ""}`.trim())
    .filter(Boolean);

  const stepNumbers = nodes
    .map((n) => n.data.stepNumber?.trim() || "")
    .filter((s) => /^\d+$/.test(s))
    .map((s) => parseInt(s, 10))
    .sort((a, b) => a - b);

  const stepPrefix =
    stepNumbers.length > 1
      ? `Trin ${stepNumbers[0]}-${stepNumbers[stepNumbers.length - 1]}: `
      : stepNumbers.length === 1
        ? `Trin ${stepNumbers[0]}: `
        : "";

  if (candidates.length === 0) return `${stepPrefix}Procesdel ${fallbackIndex}`.trim();

  const first = candidates[0]
    .replace(/\s+/g, " ")
    .replace(/[.:;,]+$/g, "")
    .trim();
  if (first.length <= 46) return `${stepPrefix}${first}`.trim();

  const words = first.split(" ");
  const shortened = words.slice(0, 6).join(" ");
  return `${stepPrefix}${shortened}...`.trim();
}

function getAppFromType(node: RpaNode): string {
  if (node.type === "start_end") return "Proces";
  if (node.data.application) return node.data.application;
  return "Generelt";
}

function getExecutionOrder(
  nodes: RpaNode[],
  edges: RpaEdge[]
): RpaNode[] {
  // Build adjacency map
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const nodeMap = new Map<string, RpaNode>();

  for (const n of nodes) {
    nodeMap.set(n.id, n);
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  }

  for (const e of edges) {
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  }

  // Find start node (no incoming edges)
  const startNodes = nodes.filter(
    (n) => (incoming.get(n.id)?.length || 0) === 0
  );

  // BFS to get execution order
  const visited = new Set<string>();
  const order: RpaNode[] = [];
  const queue = startNodes.length > 0 ? [startNodes[0].id] : [nodes[0].id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodeMap.get(id);
    if (node) order.push(node);

    const targets = outgoing.get(id) || [];
    for (const t of targets) {
      if (!visited.has(t)) {
        queue.push(t);
      }
    }
  }

  // Add any unvisited nodes at the end
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      order.push(n);
    }
  }

  return order;
}

export function getSwimlaneBackgrounds(
  swimlanes: SwimlaneInfo[],
  totalHeight: number
) {
  return swimlanes.map((sl) => ({
    application: sl.application,
    x: sl.x,
    y: 0,
    width: SWIMLANE_WIDTH,
    height: Math.max(totalHeight + 110, 760),
  }));
}

export const SWIMLANE_CONSTANTS = {
  SWIMLANE_WIDTH,
  SWIMLANE_GAP,
  NODE_VERTICAL_SPACING,
  GROUP_VERTICAL_GAP,
  HEADER_HEIGHT,
  PADDING_X,
  PADDING_Y,
};
