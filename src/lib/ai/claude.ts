import Anthropic from "@anthropic-ai/sdk";
import type { AiGeneratedFlowchart } from "../types";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";

const MODEL_NAME = "claude-sonnet-4-5-20250929";

export async function generateWithClaude(
  apiKey: string,
  screenshots: Array<{ base64: string; mediaType: string }>,
  textDescription: string
): Promise<AiGeneratedFlowchart> {
  const client = new Anthropic({ apiKey });

  const imageContent: Anthropic.MessageCreateParams["messages"][0]["content"] =
    screenshots.map((s, i) => [
      {
        type: "text" as const,
        text: `Screenshot ${i + 1}:`,
      },
      {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: s.mediaType as
            | "image/jpeg"
            | "image/png"
            | "image/webp"
            | "image/gif",
          data: s.base64,
        },
      },
    ]).flat();

  const response = await client.messages.create({
    model: MODEL_NAME,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
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

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseAiResponse(text);

  // Extract token usage from Claude response
  parsed.usage = {
    model: MODEL_NAME,
    provider: "claude",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
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
