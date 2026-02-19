"use client";
import { useState } from "react";
import type { AiGeneratedFlowchart, AiUsageInfo } from "@/lib/types";

interface AIPanelProps {
  projectId: string;
  screenshots: Array<{ base64: string; mediaType: string }>;
  textDescription: string;
  onGenerated: (result: AiGeneratedFlowchart) => void;
}

const providerLabels: Record<string, string> = {
  claude: "Claude",
  "azure-openai": "Azure OpenAI",
  gemini: "Google Gemini",
};

const PRICE_PER_1M_TOKENS_USD: Record<string, { input: number; output: number }> = {
  // Estimated list prices in USD per 1M tokens.
  // Actual price can vary by region, account tier and provider updates.
  "gemini:gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "claude:claude-sonnet-4-5-20250929": { input: 3.0, output: 15.0 },
  "azure-openai:gpt-4o": { input: 2.5, output: 10.0 },
};

const USD_TO_DKK_RATE = 6.95;

function estimateCostDkk(usage: AiUsageInfo): number | null {
  const key = `${usage.provider}:${usage.model}`;
  const price = PRICE_PER_1M_TOKENS_USD[key];
  if (!price) return null;

  const inputCost = (usage.inputTokens / 1_000_000) * price.input;
  const outputCost = (usage.outputTokens / 1_000_000) * price.output;
  const usdCost = inputCost + outputCost;
  return usdCost * USD_TO_DKK_RATE;
}

export default function AIPanel({
  projectId,
  screenshots,
  textDescription,
  onGenerated,
}: AIPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<AiUsageInfo | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const generate = async () => {
    if (!textDescription.trim() && screenshots.length === 0) {
      setError("Tilfoej en beskrivelse eller screenshots foerst");
      return;
    }

    setGenerating(true);
    setError(null);
    setUsage(null);
    setElapsed(null);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          textDescription,
          screenshots,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generering fejlede");
      }

      const result: AiGeneratedFlowchart = await res.json();
      setElapsed(Math.round((Date.now() - startTime) / 1000));

      if (result.usage) {
        setUsage(result.usage);
      }

      onGenerated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={generate}
        disabled={generating}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
            Genererer flowchart...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generer flowchart med AI
          </>
        )}
      </button>

      {screenshots.length > 0 && (
        <p className="text-xs text-zinc-400">
          {screenshots.length} screenshot(s) klar til analyse
        </p>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {usage && (
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-zinc-200">
              {providerLabels[usage.provider] || usage.provider}
            </span>
            <span className="text-xs text-zinc-500">|</span>
            <span className="text-xs text-zinc-400 font-mono">
              {usage.model}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-zinc-900/60 rounded-md py-1.5 px-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Tid</p>
              <p className="text-xs font-mono text-zinc-300">
                {elapsed !== null ? `${elapsed}s` : "-"}
              </p>
            </div>
            <div className="bg-zinc-900/60 rounded-md py-1.5 px-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Est. pris (DKK)</p>
              <p className="text-xs font-mono text-emerald-400 font-semibold">
                {(() => {
                  const cost = estimateCostDkk(usage);
                  return cost !== null
                    ? `${cost.toLocaleString("da-DK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} kr.`
                    : "Ukendt";
                })()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Input</p>
              <p className="text-xs font-mono text-zinc-300">
                {usage.inputTokens.toLocaleString("da-DK")}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Output</p>
              <p className="text-xs font-mono text-zinc-300">
                {usage.outputTokens.toLocaleString("da-DK")}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
              <p className="text-xs font-mono text-blue-400 font-semibold">
                {usage.totalTokens.toLocaleString("da-DK")}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">
            Pris er et estimat baseret paa tokenforbrug (USD-&gt;DKK kurs: {USD_TO_DKK_RATE}).
          </p>
        </div>
      )}
    </div>
  );
}
