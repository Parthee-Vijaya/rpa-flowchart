import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createVideoJob,
  updateVideoJobProgress,
  completeVideoJob,
  failVideoJob,
  getSetting,
} from "@/lib/db";
import { analyzeVideoWithGemini } from "@/lib/ai/gemini-video";

const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB for inline Gemini payload

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const projectId = formData.get("projectId");

  if (!(file instanceof File) || typeof projectId !== "string" || !projectId.trim()) {
    return NextResponse.json(
      { error: "Video-fil og projectId er paakraevet" },
      { status: 400 }
    );
  }

  const fileName = file.name || "video";
  const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v|avi)$/i.test(fileName);
  if (!isVideo) {
    return NextResponse.json({ error: "Kun video-filer er understoettet" }, { status: 400 });
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json(
      {
        error:
          "Video-filen er for stor til direkte analyse. Brug en fil under 20 MB i denne version.",
      },
      { status: 400 }
    );
  }

  const jobId = randomUUID();
  createVideoJob({
    id: jobId,
    projectId,
    originalName: fileName,
  });

  void processVideoJob({
    jobId,
    file,
    strictMode: getSetting("ai_strict_mode") === "true",
  });

  return NextResponse.json({ jobId, status: "processing" });
}

async function processVideoJob(input: {
  jobId: string;
  file: File;
  strictMode: boolean;
}) {
  try {
    updateVideoJobProgress(input.jobId, {
      status: "processing",
      progress: 10,
      currentStep: "Forbereder videoanalyse",
    });

    const apiKey =
      getSetting("ai_api_key") ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error("Ingen Gemini API-noegle fundet i indstillinger eller miljoevariabler");
    }

    updateVideoJobProgress(input.jobId, {
      progress: 28,
      currentStep: "Indlaeser video og metadata",
    });

    const videoBuffer = Buffer.from(await input.file.arrayBuffer());

    updateVideoJobProgress(input.jobId, {
      progress: 45,
      currentStep: "Analyserer lyd og billeder med Gemini cloud OCR",
    });

    const analysis = await analyzeVideoWithGemini({
      apiKey,
      videoBuffer,
      mimeType: input.file.type || "video/mp4",
      strictMode: input.strictMode,
    });

    updateVideoJobProgress(input.jobId, {
      progress: 82,
      currentStep: "Sammensaetter proceskontekst",
    });

    const combinedText = [
      analysis.processContext ? `Proceskontekst:\n${analysis.processContext}` : "",
      analysis.transcriptText ? `Transskription:\n${analysis.transcriptText}` : "",
      analysis.visualText ? `Visuelle observationer/OCR:\n${analysis.visualText}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    completeVideoJob(input.jobId, {
      transcriptText: analysis.transcriptText,
      visualText: analysis.visualText,
      combinedText,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Videoanalyse fejlede af ukendt aarsag";
    console.error("Video import error:", error);
    failVideoJob(input.jobId, message);
  }
}
