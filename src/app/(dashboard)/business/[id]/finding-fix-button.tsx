"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function FindingFixButton({ findingId }: { findingId: string }) {
  const [fixed, setFixed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function markFixed() {
    setLoading(true);
    try {
      const res = await fetch(`/api/findings/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixed: true }),
      });
      if (res.ok) setFixed(true);
    } catch {}
    setLoading(false);
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
      onClick={markFixed}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors flex-shrink-0 flex items-center gap-1"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      Fix Now
    </button>
  );
}
