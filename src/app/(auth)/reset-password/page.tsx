"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token || !email) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Invalid reset link</h2>
          <p className="text-slate-500 mt-1">This password reset link is invalid or has expired.</p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-block w-full text-center h-11 leading-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Password reset!</h2>
          <p className="text-slate-500 mt-1">Your password has been changed successfully.</p>
        </div>
        <Link
          href="/login"
          className="inline-block w-full text-center h-11 leading-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          Sign in with new password
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Set new password</h2>
        <p className="text-slate-500 mt-1">Choose a new password for {email}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
            minLength={8}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center text-slate-400 py-12">Loading...</div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
