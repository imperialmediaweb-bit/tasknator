"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Shield, Save, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("workspace");
  const [workspaceName, setWorkspaceName] = useState("");
  const [locale, setLocale] = useState("en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setWorkspaceName(data.workspaceName || "");
        setLocale(data.locale || "en");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveWorkspace() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceName, locale }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setSaving(false);
  }

  async function changePassword() {
    setPwSaving(true);
    setPwMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMessage({ type: "success", text: "Password updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPwMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch {
      setPwMessage({ type: "error", text: "Something went wrong" });
    }
    setPwSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your workspace configuration</p>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px">
        {[
          { id: "workspace", label: "Workspace", icon: Settings },
          { id: "security", label: "Security", icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "workspace" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Workspace Settings</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  placeholder="My Workspace"
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
                <select
                  value={locale}
                  onChange={e => setLocale(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="en">English</option>
                  <option value="ro">Romanian</option>
                </select>
              </div>
              <button
                onClick={saveWorkspace}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Change Password</h3>
            <div className="space-y-3">
              {pwMessage && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                  pwMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {pwMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {pwMessage.text}
                </div>
              )}
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={changePassword}
                disabled={pwSaving || !currentPassword || newPassword.length < 6}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
