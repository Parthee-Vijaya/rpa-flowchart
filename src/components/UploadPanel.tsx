"use client";
import { useState, useCallback, useRef, useEffect } from "react";

interface UploadPanelProps {
  projectId: string;
  onImagesUploaded: (images: Array<{ url: string; base64: string; mediaType: string }>) => void;
  onPptxImported: (slides: Array<{ slideNumber: number; title: string; textContent: string; images: Array<{ filename: string; data: string; contentType: string }> }>) => void;
  onTextChange: (text: string) => void;
  text: string;
}

interface VideoJobStatus {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  currentStep: string;
  error?: string | null;
  combinedText?: string;
  originalName?: string;
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
  const [mhtLoading, setMhtLoading] = useState(false);
  const [pdfImportedInfo, setPdfImportedInfo] = useState<{
    count: number;
    pages: number;
  } | null>(null);
  const [mhtImportedCount, setMhtImportedCount] = useState(0);
  const [videoJob, setVideoJob] = useState<VideoJobStatus | null>(null);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

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
    const mhtFiles = files.filter((f) => {
      const name = f.name.toLowerCase();
      return (
        name.endsWith(".mht") ||
        name.endsWith(".mhtml") ||
        f.type === "message/rfc822" ||
        f.type === "multipart/related"
      );
    });
    const videoFiles = files.filter(
      (f) => f.type.startsWith("video/") || /\.(mp4|mov|webm|m4v|avi)$/i.test(f.name)
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

    if (videoFiles.length > 0) {
      await importVideo(videoFiles[0]);
    }

    if (mhtFiles.length > 0) {
      setMhtLoading(true);
      try {
        const mhtTextBlocks: string[] = [];
        for (const file of mhtFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", projectId);

          const res = await fetch("/api/import-mht", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "MHT-import fejlede");
          }

          const extractedText =
            typeof data.textContent === "string" ? data.textContent.trim() : "";
          if (extractedText) {
            const title = typeof data.title === "string" && data.title.trim()
              ? data.title.trim()
              : file.name;
            mhtTextBlocks.push(`[MHT: ${title}]\n${extractedText}`);
          }
        }

        if (mhtTextBlocks.length > 0) {
          const nextText = [textRef.current.trim(), ...mhtTextBlocks]
            .filter(Boolean)
            .join("\n\n");
          onTextChange(nextText);
          setMhtImportedCount((count) => count + mhtTextBlocks.length);
        }
      } catch (err) {
        console.error("MHT import fejl:", err);
      } finally {
        setMhtLoading(false);
      }
    }
  };

  const importVideo = async (file: File) => {
    setVideoJob({
      id: "",
      status: "processing",
      progress: 2,
      currentStep: "Uploader video...",
      originalName: file.name,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch("/api/import-video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Video-import fejlede");
      }

      await pollVideoJob(data.jobId, file.name);
    } catch (error) {
      setVideoJob({
        id: "",
        status: "failed",
        progress: 100,
        currentStep: "Videoanalyse fejlede",
        error: error instanceof Error ? error.message : "Ukendt fejl",
        originalName: file.name,
      });
    }
  };

  const pollVideoJob = async (jobId: string, fileName: string) => {
    let done = false;
    while (!done) {
      const response = await fetch(`/api/video-jobs/${jobId}`, { cache: "no-store" });
      const data = (await response.json()) as VideoJobStatus;

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Kunne ikke hente video-job status");
      }

      const nextState: VideoJobStatus = {
        id: data.id,
        status: data.status,
        progress: data.progress,
        currentStep: data.currentStep || "",
        error: data.error,
        combinedText: data.combinedText,
        originalName: data.originalName || fileName,
      };
      setVideoJob(nextState);

      if (data.status === "completed") {
        const extracted = (data.combinedText || "").trim();
        if (extracted) {
          const nextText = [textRef.current.trim(), `[VIDEO: ${fileName}]\n${extracted}`]
            .filter(Boolean)
            .join("\n\n");
          onTextChange(nextText);
        }
        done = true;
      } else if (data.status === "failed") {
        done = true;
      } else {
        await sleep(1200);
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
          Screenshots / PowerPoint / PDF / Video
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
          {uploading || pptxLoading || pdfLoading || mhtLoading || (videoJob?.status === "processing") ? (
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
                  : mhtLoading
                    ? "Importerer MHT..."
                  : videoJob?.status === "processing"
                    ? videoJob.currentStep || "Analyserer video..."
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
                    accept="image/*,.pptx,.pdf,.mht,.mhtml,video/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-zinc-500">
                PNG, JPG, PPTX, PDF, MHT, MP4/WebM - max 50 MB (video: max 20 MB)
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
        {mhtImportedCount > 0 && (
          <p className="text-xs text-green-400 mt-1">
            {mhtImportedCount} MHT-fil(er) importeret
          </p>
        )}
        {videoJob && (
          <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-300 truncate pr-3">
                Video: {videoJob.originalName || "upload"}
              </span>
              <span
                className={
                  videoJob.status === "completed"
                    ? "text-green-400"
                    : videoJob.status === "failed"
                      ? "text-red-400"
                      : "text-blue-400"
                }
              >
                {videoJob.progress}%
              </span>
            </div>
            <div className="h-2 w-full rounded bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  videoJob.status === "failed" ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.max(0, Math.min(100, videoJob.progress))}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              {videoJob.status === "failed"
                ? videoJob.error || "Videoanalyse fejlede"
                : videoJob.currentStep || "Analyserer video"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
