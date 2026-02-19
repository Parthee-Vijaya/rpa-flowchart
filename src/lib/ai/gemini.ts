import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiGeneratedFlowchart } from "../types";
import { buildUserMessage, getSystemPrompt } from "./prompt";

const MODEL_NAME = "gemini-2.0-flash";

export async function generateWithGemini(
  apiKey: string,
  screenshots: Array<{ base64: string; mediaType: string }>,
  textDescription: string,
  strictMode = false
): Promise<AiGeneratedFlowchart> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const imageParts = screenshots.map((s) => ({
    inlineData: {
      data: s.base64,
      mimeType: s.mediaType,
    },
  }));

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: getSystemPrompt(strictMode) },
          ...imageParts,
          {
            text: buildUserMessage(textDescription, screenshots.length, strictMode),
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 8000,
      temperature: 0.2,
    },
  });

  const text = result.response.text();
  const parsed = parseAiResponse(text);

  // Extract token usage from Gemini response
  const usageMetadata = result.response.usageMetadata;
  parsed.usage = {
    model: MODEL_NAME,
    provider: "gemini",
    inputTokens: usageMetadata?.promptTokenCount ?? 0,
    outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: usageMetadata?.totalTokenCount ?? 0,
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
