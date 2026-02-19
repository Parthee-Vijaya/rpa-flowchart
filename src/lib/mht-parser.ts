export interface ParsedMht {
  textContent: string;
  title: string;
}

export async function parseMht(fileBuffer: Buffer): Promise<ParsedMht> {
  const raw = decodeBestEffort(fileBuffer);
  const title = extractHeader(raw, "Subject") || "MHT-dokument";
  const boundary = extractBoundary(raw);

  const parts = boundary ? splitMimeParts(raw, boundary) : [raw];

  const extracted: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (!lower.includes("content-type: text/plain") && !lower.includes("content-type: text/html")) {
      continue;
    }
    const decoded = decodeMimePartBody(part);
    if (!decoded.trim()) continue;

    if (lower.includes("content-type: text/html")) {
      extracted.push(htmlToText(decoded));
    } else {
      extracted.push(normalizeText(decoded));
    }
  }

  const fallbackBody = extracted.length > 0 ? extracted.join("\n\n") : htmlToText(raw);
  return {
    title: normalizeText(title),
    textContent: normalizeText(fallbackBody),
  };
}

function decodeBestEffort(buffer: Buffer): string {
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("\uFFFD")) return utf8;
  return buffer.toString("latin1");
}

function extractHeader(raw: string, name: string): string {
  const regex = new RegExp(`^${name}:\\s*(.+)$`, "im");
  const match = raw.match(regex);
  return match?.[1]?.trim() || "";
}

function extractBoundary(raw: string): string | null {
  const match = raw.match(/boundary="?([^"\r\n;]+)"?/i);
  return match?.[1] || null;
}

function splitMimeParts(raw: string, boundary: string): string[] {
  const marker = `--${boundary}`;
  return raw
    .split(marker)
    .map((p) => p.trim())
    .filter((p) => p && p !== "--");
}

function decodeMimePartBody(part: string): string {
  const splitIndex = part.search(/\r?\n\r?\n/);
  if (splitIndex < 0) return "";

  const headers = part.slice(0, splitIndex);
  let body = part.slice(splitIndex).replace(/^\r?\n\r?\n/, "");
  const transferEncoding = (headers.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1] || "")
    .trim()
    .toLowerCase();

  if (transferEncoding === "base64") {
    try {
      const normalized = body.replace(/\s+/g, "");
      return Buffer.from(normalized, "base64").toString("utf8");
    } catch {
      return body;
    }
  }

  if (transferEncoding === "quoted-printable") {
    body = body.replace(/=\r?\n/g, "");
    body = body.replace(/=([A-Fa-f0-9]{2})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  }

  return body;
}

function htmlToText(html: string): string {
  return normalizeText(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
  );
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
