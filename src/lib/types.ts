export type RpaNodeType =
  | "process_step"
  | "decision"
  | "application_switch"
  | "data_input"
  | "blocker"
  | "start_end";

export interface RpaNodeData {
  label: string;
  description?: string;
  application?: string;
  stepNumber?: string;
  screenshotUrl?: string;
  isStartNode?: boolean;
  decisionQuestion?: string;
}

export interface RpaNode {
  id: string;
  type: RpaNodeType;
  position: { x: number; y: number };
  data: RpaNodeData;
}

export interface RpaEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: "default" | "step" | "smoothstep";
  animated?: boolean;
}

export interface FlowchartProject {
  id: string;
  name: string;
  description?: string;
  processOwner?: string;
  nodes: RpaNode[];
  edges: RpaEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface AiUsageInfo {
  model: string;
  provider: AiProvider;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AiGeneratedFlowchart {
  nodes: RpaNode[];
  edges: RpaEdge[];
  processName: string;
  processSummary: string;
  usage?: AiUsageInfo;
}

export type AiProvider = "claude" | "azure-openai" | "gemini";

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  azureEndpoint?: string;
}

export interface UploadedFile {
  id: string;
  projectId: string;
  originalName: string;
  url: string;
  type: "screenshot" | "pptx_image";
  slideNumber?: number;
}

export interface ParsedSlide {
  slideNumber: number;
  title: string;
  textContent: string;
  images: Array<{
    filename: string;
    data: string; // base64
    contentType: string;
  }>;
}
