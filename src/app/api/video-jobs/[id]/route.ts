import { NextRequest, NextResponse } from "next/server";
import { getVideoJobById } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const job = getVideoJobById(id);

  if (!job) {
    return NextResponse.json({ error: "Video-job ikke fundet" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    currentStep: job.current_step || "",
    error: job.error,
    originalName: job.original_name,
    transcriptText: job.transcript_text || "",
    visualText: job.visual_text || "",
    combinedText: job.combined_text || "",
  });
}
