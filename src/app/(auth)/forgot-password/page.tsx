"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
          <p className="text-slate-500 mt-1">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
          Check your inbox (and spam folder) for the reset link. The link expires in 1 hour.
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
        <p className="text-slate-500 mt-1">Enter your email and we&apos;ll send you a reset link</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
