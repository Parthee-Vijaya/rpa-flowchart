import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { pathToFileURL } from "url";

export interface ParsedPdf {
  textContent: string;
  pageCount: number;
  title: string;
}

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")
).toString();

export async function parsePdf(fileBuffer: Buffer): Promise<ParsedPdf> {
  const loadingTask = getDocument({
    data: new Uint8Array(fileBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  try {
    const textChunks: string[] = [];
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) =>
          typeof item === "object" && "str" in item
            ? String(item.str)
            : ""
        )
        .filter(Boolean)
        .join("\n");

      if (pageText.trim()) {
        textChunks.push(pageText.trim());
      }
    }

    const metadata = await pdf.getMetadata().catch(() => null);
    const rawTitle = metadata?.info?.Title;

    return {
      textContent: normalizePdfText(textChunks.join("\n\n")),
      pageCount: pdf.numPages || 0,
      title: typeof rawTitle === "string" ? rawTitle.trim() : "",
    };
  } finally {
    await loadingTask.destroy();
  }
}

function normalizePdfText(text: string): string {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}
