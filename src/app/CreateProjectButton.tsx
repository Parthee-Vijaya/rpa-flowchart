"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateProjectButton({ large }: { large?: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nyt RPA-projekt" }),
      });
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error("Fejl ved oprettelse:", err);
      setCreating(false);
    }
  };

  if (large) {
    return (
      <button
        onClick={create}
        disabled={creating}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm"
      >
        {creating ? "Opretter..." : "Opret nyt projekt"}
      </button>
    );
  }

  return (
    <button
      onClick={create}
      disabled={creating}
      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-1.5 px-4 rounded-lg transition-colors text-sm flex items-center gap-1.5"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {creating ? "Opretter..." : "Nyt projekt"}
    </button>
  );
}
