import { NextRequest, NextResponse } from "next/server";
import { parsePptx } from "@/lib/pptx-parser";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Ingen fil uploadet" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const slides = await parsePptx(buffer);

    return NextResponse.json({
      slides,
      totalSlides: slides.length,
      totalImages: slides.reduce((sum, s) => sum + s.images.length, 0),
    });
  } catch (error) {
    console.error("PPTX parse error:", error);
    return NextResponse.json(
      { error: "Kunne ikke laese PowerPoint-filen" },
      { status: 500 }
    );
  }
}
