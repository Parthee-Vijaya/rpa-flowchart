import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

interface VideoAnalysisResult {
  transcriptText: string;
  visualText: string;
  processContext: string;
}

interface GeminiVideoResponse {
  transcriptText?: string;
  visualText?: string;
  processContext?: string;
}

const BASE_PROMPT = `Du analyserer en video med skaermoptagelse og tale om en forretningsproces.
Udtraek:
1) tale/transskription med fokus paa procestrin og regler,
2) synlig UI-tekst og handlinger fra skærmbillederne (OCR-lignende),
3) en samlet proceskontekst der er klar til RPA flowchart-generering.

Svar KUN i valid JSON:
{
  "transcriptText": "kort men konkret transskript af relevante handlinger og beslutninger",
  "visualText": "udtrukket UI-tekst + observerede klik/navigation/systemskift",
  "processContext": "struktureret procesbeskrivelse til RPA-udvikler"
}

Krav:
- Dansk sprog
- Vaer konkret og handlingsorienteret
- Opfind ikke data; marker uklarheder tydeligt`;

const STRICT_APPENDIX = `
- Strict mode: Lever as-is proces uden antagelser
- Hvis information mangler, skriv eksplicit hvad der mangler
- Prioriter sporbar sekvens med tydelige trin og beslutningskriterier`;

export async function analyzeVideoWithGemini(input: {
  apiKey: string;
  videoBuffer: Buffer;
  mimeType: string;
  strictMode: boolean;
}): Promise<VideoAnalysisResult> {
  const genAI = new GoogleGenerativeAI(input.apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = input.strictMode ? `${BASE_PROMPT}\n${STRICT_APPENDIX}` : BASE_PROMPT;

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: input.videoBuffer.toString("base64"),
              mimeType: input.mimeType || "video/mp4",
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: input.strictMode ? 0.1 : 0.2,
      maxOutputTokens: 3500,
    },
  });

  const text = response.response.text();
  const parsed = parseJsonResponse(text);

  return {
    transcriptText: (parsed.transcriptText || "").trim(),
    visualText: (parsed.visualText || "").trim(),
    processContext: (parsed.processContext || "").trim(),
  };
}

function parseJsonResponse(text: string): GeminiVideoResponse {
  try {
    return JSON.parse(text) as GeminiVideoResponse;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return {};
    }
    try {
      return JSON.parse(match[0]) as GeminiVideoResponse;
    } catch {
      return {};
    }
  }
}
