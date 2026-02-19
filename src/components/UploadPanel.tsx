"use client";
import { useState, useCallback } from "react";

interface UploadPanelProps {
  projectId: string;
  onImagesUploaded: (images: Array<{ url: string; base64: string; mediaType: string }>) => void;
  onPptxImported: (slides: Array<{ slideNumber: number; title: string; textContent: string; images: Array<{ filename: string; data: string; contentType: string }> }>) => void;
  onTextChange: (text: string) => void;
  text: string;
}

export default function UploadPanel({
  projectId,
  onImagesUploaded,
  onPptxImported,
  onTextChange,
  text,
}: UploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfImportedInfo, setPdfImportedInfo] = useState<{
    count: number;
    pages: number;
  } | null>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    },
    [projectId]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const pptxFiles = files.filter(
      (f) =>
        f.name.endsWith(".pptx") ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    const pdfFiles = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (pptxFiles.length > 0) {
      setPptxLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", pptxFiles[0]);
        formData.append("projectId", projectId);

        const res = await fetch("/api/import-pptx", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.slides) {
          onPptxImported(data.slides);
        }
      } catch (err) {
        console.error("PPTX import fejl:", err);
      } finally {
        setPptxLoading(false);
      }
    }

    if (imageFiles.length > 0) {
      setUploading(true);
      try {
        const results: Array<{ url: string; base64: string; mediaType: string }> = [];
        for (const file of imageFiles) {
          const base64 = await fileToBase64(file);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", projectId);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          results.push({
            url: data.url,
            base64: base64.split(",")[1],
            mediaType: file.type,
          });
        }
        onImagesUploaded(results);
        setUploadedCount((c) => c + results.length);
      } catch (err) {
        console.error("Upload fejl:", err);
      } finally {
        setUploading(false);
      }
    }

    if (pdfFiles.length > 0) {
      setPdfLoading(true);
      try {
        const pdfTextBlocks: string[] = [];
        let totalPages = 0;

        for (const file of pdfFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", projectId);

          const res = await fetch("/api/import-pdf", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "PDF-import fejlede");
          }

          const extractedText =
            typeof data.textContent === "string" ? data.textContent.trim() : "";

          if (extractedText) {
            const titlePart = file.name ? `${file.name}` : "PDF";
            pdfTextBlocks.push(`[PDF: ${titlePart}]\n${extractedText}`);
          }

          if (typeof data.pageCount === "number") {
            totalPages += data.pageCount;
          }
        }

        if (pdfTextBlocks.length > 0) {
          const nextText = [text.trim(), ...pdfTextBlocks]
            .filter(Boolean)
            .join("\n\n");
          onTextChange(nextText);
        }

        setPdfImportedInfo({ count: pdfFiles.length, pages: totalPages });
      } catch (err) {
        console.error("PDF import fejl:", err);
      } finally {
        setPdfLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Procesbeskrivelse
        </label>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={5}
          placeholder="Beskriv processen trin-for-trin..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Screenshots / PowerPoint / PDF
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("border-blue-500");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("border-blue-500");
          }}
          onDrop={(e) => {
            e.currentTarget.classList.remove("border-blue-500");
            handleDrop(e);
          }}
          className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center transition-colors"
        >
          {uploading || pptxLoading || pdfLoading ? (
            <div className="text-blue-400 text-sm">
              <svg
                className="animate-spin h-6 w-6 mx-auto mb-2"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {pptxLoading
                ? "Importerer PowerPoint..."
                : pdfLoading
                  ? "Importerer PDF..."
                  : "Uploader..."}
            </div>
          ) : (
            <>
              <svg
                className="w-8 h-8 text-zinc-500 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-zinc-400 mb-1">
                Traek filer hertil eller{" "}
                <label className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                  gennemse
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pptx,.pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-zinc-500">
                PNG, JPG, PPTX, PDF - max 50 MB
              </p>
            </>
          )}
        </div>

        {uploadedCount > 0 && (
          <p className="text-xs text-green-400 mt-2">
            {uploadedCount} billede(r) uploadet
          </p>
        )}
        {pdfImportedInfo && (
          <p className="text-xs text-green-400 mt-1">
            {pdfImportedInfo.count} PDF-fil(er) importeret ({pdfImportedInfo.pages} sider)
          </p>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
