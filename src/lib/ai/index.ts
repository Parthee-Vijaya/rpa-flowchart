import type { AiProvider, AiGeneratedFlowchart } from "../types";
import { generateWithClaude } from "./claude";
import { generateWithAzure } from "./azure-openai";
import { generateWithGemini } from "./gemini";

export async function generateFlowchart(
  provider: AiProvider,
  apiKey: string,
  azureEndpoint: string | null,
  screenshots: Array<{ base64: string; mediaType: string }>,
  textDescription: string,
  strictMode = false
): Promise<AiGeneratedFlowchart> {
  switch (provider) {
    case "claude":
      return generateWithClaude(apiKey, screenshots, textDescription, strictMode);
    case "azure-openai":
      if (!azureEndpoint) {
        throw new Error("Azure endpoint er paakraevet for Azure OpenAI");
      }
      return generateWithAzure(
        apiKey,
        azureEndpoint,
        screenshots,
        textDescription,
        strictMode
      );
    case "gemini":
      return generateWithGemini(apiKey, screenshots, textDescription, strictMode);
    default:
      throw new Error(`Ukendt AI-provider: ${provider}`);
  }
}
