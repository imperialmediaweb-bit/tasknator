"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export function BillingActions({ planTier, workspaceId, paypalEnabled }: {
  planTier: string;
  workspaceId: string;
  paypalEnabled: boolean;
}) {
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [error, setError] = useState("");

  async function handleStripe() {
    setLoading("stripe");
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier, workspaceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong");
      setLoading(null);
    }
  }

  async function handlePayPal() {
    setLoading("paypal");
    setError("");
    try {
      const res = await fetch("/api/billing/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier, workspaceId }),
      });
      const data = await res.json();
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        setError(data.error || "Failed to create PayPal order");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {/* Stripe Button */}
      <button
        onClick={handleStripe}
        disabled={!!loading}
        className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading === "stripe" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        Pay with Card
      </button>

      {/* PayPal Button */}
      {paypalEnabled && (
        <button
          onClick={handlePayPal}
          disabled={!!loading}
          className="w-full py-2.5 rounded-xl bg-[#0070ba] text-white text-sm font-medium hover:bg-[#005ea6] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading === "paypal" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.72a.77.77 0 01.757-.659h6.515c2.168 0 3.696.467 4.54 1.388.393.43.648.903.764 1.406.122.53.124 1.165.006 1.943l-.013.083v.73l.572.324c.484.268.87.582 1.151.942.352.449.579.997.674 1.628.098.654.063 1.414-.103 2.26a7.286 7.286 0 01-.84 2.2 4.97 4.97 0 01-1.345 1.457 5.489 5.489 0 01-1.811.872c-.69.197-1.478.297-2.348.297H12.84a.95.95 0 00-.938.805l-.039.2-.66 4.179-.03.144a.95.95 0 01-.938.805H7.076z"/>
            </svg>
          )}
          Pay with PayPal
        </button>
      )}
    </div>
  );
}
