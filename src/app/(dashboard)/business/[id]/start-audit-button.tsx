"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Zap } from "lucide-react";

export function StartAuditButton({ businessId, hasAudit }: { businessId: string; hasAudit: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  const pollStatus = useCallback(async (auditRunId: string) => {
    try {
      const res = await fetch(`/api/audit/${auditRunId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setProgress(data.progress || 0);
      setStatus(data.status);

      if (data.status === "COMPLETED") {
        setLoading(false);
        setProgress(0);
        setStatus(null);
        router.refresh();
        return;
      }

      if (data.status === "FAILED") {
        setLoading(false);
        setProgress(0);
        setStatus(null);
        return;
      }

      // Keep polling
      setTimeout(() => pollStatus(auditRunId), 2000);
    } catch {
      setTimeout(() => pollStatus(auditRunId), 3000);
    }
  }, [router]);

  async function startAudit() {
    setLoading(true);
    setProgress(0);
    setStatus("QUEUED");

    try {
      const res = await fetch(`/api/audit/${businessId}/start`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to start audit");
        setLoading(false);
        setStatus(null);
        return;
      }

      const data = await res.json();
      pollStatus(data.auditRunId);
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
      setStatus(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            {status === "QUEUED" && "Starting audit..."}
            {status === "RUNNING" && `Analyzing... ${progress}%`}
            {!status && "Processing..."}
          </span>
        </div>
        {progress > 0 && (
          <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={startAudit}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      {hasAudit ? <><RefreshCw className="w-4 h-4" /> Re-run Audit</> : <><Zap className="w-4 h-4" /> Run Audit</>}
    </button>
  );
}
