import type { RpaNode, RpaEdge } from "./types";

const SWIMLANE_WIDTH = 350;
const SWIMLANE_GAP = 50;
const NODE_VERTICAL_SPACING = 95;
const HEADER_HEIGHT = 60;
const PADDING_X = 60;
const PADDING_Y = 20;

interface SwimlaneInfo {
  application: string;
  columnIndex: number;
  x: number;
  nodes: RpaNode[];
}

export function applySwimlaneLayout(
  nodes: RpaNode[],
  edges: RpaEdge[]
): { nodes: RpaNode[]; swimlanes: SwimlaneInfo[] } {
  if (nodes.length === 0) return { nodes, swimlanes: [] };

  // 1. Determine execution order from edges
  const ordered = getExecutionOrder(nodes, edges);

  // 2. Group consecutive nodes by application
  const groups = groupByApplication(ordered);

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

  // 4. Position nodes within swimlanes
  // Each swimlane manages its own Y position independently
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

    const endY =
      currentY + group.nodes.length * NODE_VERTICAL_SPACING;
    swimlaneY.set(group.app, endY);
  }

  return { nodes: repositionedNodes, swimlanes };
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
    height: Math.max(totalHeight + 80, 600),
  }));
}

export const SWIMLANE_CONSTANTS = {
  SWIMLANE_WIDTH,
  SWIMLANE_GAP,
  NODE_VERTICAL_SPACING,
  HEADER_HEIGHT,
  PADDING_X,
  PADDING_Y,
};
