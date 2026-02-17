import { NextRequest, NextResponse } from "next/server";
import { generateFlowchart } from "@/lib/ai";
import { getSetting } from "@/lib/db";
import type { AiProvider } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { textDescription, screenshots } = body;

  // Get AI settings
  const provider = (getSetting("ai_provider") || "claude") as AiProvider;
  const apiKey = getSetting("ai_api_key");
  const azureEndpoint = getSetting("ai_azure_endpoint") || null;

  // Fallback to env variable
  const effectiveKey = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!effectiveKey) {
    return NextResponse.json(
      { error: "Ingen API-noegle konfigureret. Gaa til Indstillinger for at tilfoeje en." },
      { status: 400 }
    );
  }

  try {
    const result = await generateFlowchart(
      provider,
      effectiveKey,
      azureEndpoint,
      screenshots || [],
      textDescription || ""
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI-generering fejlede. Tjek din API-noegle.",
      },
      { status: 500 }
    );
  }
}
