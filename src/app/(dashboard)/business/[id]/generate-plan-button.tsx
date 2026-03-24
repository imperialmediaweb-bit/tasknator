"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, RefreshCw } from "lucide-react";

export function GeneratePlanCard({ auditRunId, hasPlan, planId, businessId }: { auditRunId: string; hasPlan: boolean; planId?: string; businessId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    setLoading(true);
    try {
      const res = await fetch(`/api/plan/${auditRunId}/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to generate plan");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.refresh();
      if (data.repairPlanId) {
        router.push(`/business/${businessId}/plan/${data.repairPlanId}`);
      }
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (hasPlan && planId) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Plan Generated</h3>
        </div>
        <p className="text-xs text-green-700 mb-3">Your recovery plan is ready.</p>
        <div className="flex gap-2">
          <button
            onClick={generatePlan}
            disabled={loading}
            className="flex-1 text-center py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {loading ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl border border-blue-100 p-5">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Generate Recovery Plan</h3>
      </div>
      <p className="text-xs text-blue-700 mb-3">Create a 30/60/90-day action plan from your audit findings.</p>
      <button
        onClick={generatePlan}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Generate Plan"}
      </button>
    </div>
  );
}
