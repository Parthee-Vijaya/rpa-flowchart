import JSZip from "jszip";
import { parseStringPromise } from "xml2js";
import type { ParsedSlide } from "./types";

export async function parsePptx(fileBuffer: Buffer): Promise<ParsedSlide[]> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const slides: ParsedSlide[] = [];

  // Find all slide files
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const slideNum = parseInt(slidePath.match(/slide(\d+)/)?.[1] || "0");
    const xmlContent = await zip.file(slidePath)?.async("string");
    if (!xmlContent) continue;

    const parsed = await parseStringPromise(xmlContent, {
      explicitArray: false,
      ignoreAttrs: false,
    });

    // Extract text from slide
    const texts = extractTexts(parsed);
    const title = texts[0] || `Slide ${slideNum}`;
    const textContent = texts.join("\n");

    // Find related images via _rels
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const images: ParsedSlide["images"] = [];

    const relsFile = zip.file(relsPath);
    if (relsFile) {
      const relsXml = await relsFile.async("string");
      const rels = await parseStringPromise(relsXml, {
        explicitArray: false,
        ignoreAttrs: false,
      });

      const relationships = rels?.Relationships?.Relationship;
      const relArray = Array.isArray(relationships)
        ? relationships
        : relationships
          ? [relationships]
          : [];

      for (const rel of relArray) {
        const target = rel?.$?.Target || "";
        if (
          rel?.$?.Type?.includes("image") &&
          target.startsWith("../media/")
        ) {
          const mediaPath = `ppt/media/${target.replace("../media/", "")}`;
          const imageFile = zip.file(mediaPath);
          if (imageFile) {
            const imageData = await imageFile.async("base64");
            const ext = mediaPath.split(".").pop()?.toLowerCase() || "png";
            const contentType =
              ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
            images.push({
              filename: mediaPath.split("/").pop() || "image.png",
              data: imageData,
              contentType,
            });
          }
        }
      }
    }

    slides.push({
      slideNumber: slideNum,
      title,
      textContent,
      images,
    });
  }

  return slides;
}

function extractTexts(obj: unknown): string[] {
  const texts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;

    // <a:t> contains text in OOXML
    if (typeof record["a:t"] === "string" && record["a:t"].trim()) {
      texts.push(record["a:t"].trim());
    }

    // Also check for direct text content
    if (typeof record["_"] === "string" && record["_"].trim()) {
      texts.push(record["_"].trim());
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        value.forEach(walk);
      } else if (typeof value === "object" && value !== null) {
        walk(value);
      }
    }
  }

  walk(obj);
  return texts;
}
