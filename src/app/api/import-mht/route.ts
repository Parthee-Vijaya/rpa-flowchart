import { NextRequest, NextResponse } from "next/server";
import { parseMht } from "@/lib/mht-parser";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Ingen fil uploadet" }, { status: 400 });
  }

  const fileName = file.name.toLowerCase();
  const isMht =
    fileName.endsWith(".mht") ||
    fileName.endsWith(".mhtml") ||
    file.type === "message/rfc822" ||
    file.type === "multipart/related";

  if (!isMht) {
    return NextResponse.json(
      { error: "Kun MHT/MHTML-filer er understoettet" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseMht(buffer);

    if (!parsed.textContent) {
      return NextResponse.json(
        { error: "MHT-filen indeholder ingen laesbar tekst" },
        { status: 400 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("MHT parse error:", error);
    return NextResponse.json(
      { error: "Kunne ikke laese MHT-filen" },
      { status: 500 }
    );
  }
}
