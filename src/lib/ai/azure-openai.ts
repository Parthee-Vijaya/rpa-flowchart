import OpenAI from "openai";
import type { AiGeneratedFlowchart } from "../types";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";

const MODEL_NAME = "gpt-4o";

export async function generateWithAzure(
  apiKey: string,
  endpoint: string,
  screenshots: Array<{ base64: string; mediaType: string }>,
  textDescription: string
): Promise<AiGeneratedFlowchart> {
  const client = new OpenAI({
    apiKey,
    baseURL: `${endpoint}/openai/deployments/${MODEL_NAME}/`,
    defaultQuery: { "api-version": "2024-08-01-preview" },
    defaultHeaders: { "api-key": apiKey },
  });

  const imageContent: OpenAI.ChatCompletionContentPart[] = screenshots.map(
    (s) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${s.mediaType};base64,${s.base64}`,
        detail: "high" as const,
      },
    })
  );

  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    max_tokens: 8000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          ...imageContent,
          {
            type: "text",
            text: buildUserMessage(textDescription, screenshots.length),
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content || "";
  const parsed = parseAiResponse(text);

  // Extract token usage from Azure OpenAI response
  parsed.usage = {
    model: response.model || MODEL_NAME,
    provider: "azure-openai",
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
  };

  return parsed;
}

function parseAiResponse(text: string): AiGeneratedFlowchart {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI returnerede ikke valid JSON");
    }
    return JSON.parse(jsonMatch[0]);
  }
}
