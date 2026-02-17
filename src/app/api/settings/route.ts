import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    provider: getSetting("ai_provider") || "claude",
    apiKey: getSetting("ai_api_key") || "",
    azureEndpoint: getSetting("ai_azure_endpoint") || "",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.provider) setSetting("ai_provider", body.provider);
  if (body.apiKey) setSetting("ai_api_key", body.apiKey);
  if (body.azureEndpoint !== undefined)
    setSetting("ai_azure_endpoint", body.azureEndpoint);

  return NextResponse.json({ ok: true });
}
