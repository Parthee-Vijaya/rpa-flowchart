"use client";
import { useState, useEffect } from "react";
import type { AiProvider } from "@/lib/types";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [provider, setProvider] = useState<AiProvider>("claude");
  const [apiKey, setApiKey] = useState("");
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.provider) setProvider(data.provider);
          if (data.apiKey) setApiKey(data.apiKey);
          if (data.azureEndpoint) setAzureEndpoint(data.azureEndpoint);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const save = async () => {
    setStatus("saving");
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, azureEndpoint }),
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI-indstillinger</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">AI-provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProvider)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="claude">Anthropic Claude</option>
              <option value="azure-openai">Azure OpenAI (GPT-4o)</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">API-noegle</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === "claude"
                  ? "sk-ant-..."
                  : provider === "gemini"
                    ? "AIza..."
                    : "Azure API key"
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {provider === "azure-openai" && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Azure endpoint
              </label>
              <input
                type="text"
                value={azureEndpoint}
                onChange={(e) => setAzureEndpoint(e.target.value)}
                placeholder="https://your-resource.openai.azure.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={save}
            disabled={!apiKey || status === "saving"}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {status === "saving"
              ? "Gemmer..."
              : status === "saved"
                ? "Gemt!"
                : status === "error"
                  ? "Fejl - proev igen"
                  : "Gem indstillinger"}
          </button>
        </div>
      </div>
    </div>
  );
}
