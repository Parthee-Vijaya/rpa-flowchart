import type { AiProvider, AiGeneratedFlowchart } from "../types";
import { generateWithClaude } from "./claude";
import { generateWithAzure } from "./azure-openai";
import { generateWithGemini } from "./gemini";

export async function generateFlowchart(
  provider: AiProvider,
  apiKey: string,
  azureEndpoint: string | null,
  screenshots: Array<{ base64: string; mediaType: string }>,
  textDescription: string
): Promise<AiGeneratedFlowchart> {
  switch (provider) {
    case "claude":
      return generateWithClaude(apiKey, screenshots, textDescription);
    case "azure-openai":
      if (!azureEndpoint) {
        throw new Error("Azure endpoint er paakraevet for Azure OpenAI");
      }
      return generateWithAzure(
        apiKey,
        azureEndpoint,
        screenshots,
        textDescription
      );
    case "gemini":
      return generateWithGemini(apiKey, screenshots, textDescription);
    default:
      throw new Error(`Ukendt AI-provider: ${provider}`);
  }
}
