import { NextRequest, NextResponse } from "next/server";
import { parsePdf } from "@/lib/pdf-parser";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Ingen fil uploadet" }, { status: 400 });
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json(
      { error: "Kun PDF-filer er understoettet" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parsePdf(buffer);

    if (!parsed.textContent) {
      return NextResponse.json(
        { error: "PDF-filen indeholder ingen laesbar tekst" },
        { status: 400 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json(
      { error: "Kunne ikke laese PDF-filen" },
      { status: 500 }
    );
  }
}
