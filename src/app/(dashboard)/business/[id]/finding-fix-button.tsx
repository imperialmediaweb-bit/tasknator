"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";

export function FindingFixButton({ findingId }: { findingId: string }) {
  const [fixed, setFixed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fixSteps, setFixSteps] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function generateFix() {
    setLoading(true);
    try {
      const res = await fetch(`/api/findings/${findingId}/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setFixSteps(data.fixSteps);
        setExpanded(true);
        setFixed(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to generate fix");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (fixSteps) {
    return (
      <div className="mt-2 w-full">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Fix Guide
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {expanded && (
          <div className="mt-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 whitespace-pre-wrap leading-relaxed">
            {fixSteps}
          </div>
        )}
      </div>
    );
  }

  if (fixed) {
    return (
      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1 flex-shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" /> Fixed
      </span>
    );
  }

  return (
    <button
      onClick={generateFix}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors flex-shrink-0 flex items-center gap-1"
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" /> Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3" /> Fix Now
        </>
      )}
    </button>
  );
}
