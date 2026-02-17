import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import sharp from "sharp";
import { saveUploadedFile } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const projectId = formData.get("projectId") as string;

  if (!file || !projectId) {
    return NextResponse.json(
      { error: "Fil og projectId er paakraevet" },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);
  await mkdir(uploadDir, { recursive: true });

  const fileId = uuid();
  const filename = `${fileId}.jpg`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());

  // Resize to max 1920px width
  const optimized = await sharp(buffer)
    .resize(1920, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  await writeFile(filepath, optimized);

  const url = `/uploads/${projectId}/${filename}`;

  saveUploadedFile({
    id: fileId,
    projectId,
    originalName: file.name,
    url,
    fileType: "screenshot",
  });

  return NextResponse.json({ id: fileId, url, originalName: file.name });
}
