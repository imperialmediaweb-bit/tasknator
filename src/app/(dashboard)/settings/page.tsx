"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Shield, Save, CheckCircle2, Loader2, AlertCircle, Paintbrush, Globe, Image, ToggleLeft, ToggleRight, Crown } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("workspace");
  const [workspaceName, setWorkspaceName] = useState("");
  const [locale, setLocale] = useState("en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("STARTER");

  // Branding state
  const [customBrandName, setCustomBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingError, setBrandingError] = useState("");

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
        setPlan(data.plan || "STARTER");
        setCustomBrandName(data.customBrandName || "");
        setLogoUrl(data.logoUrl || "");
        setCustomDomain(data.customDomain || "");
        setWhiteLabelEnabled(data.whiteLabelEnabled || false);
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

  async function saveBranding() {
    setBrandingSaving(true);
    setBrandingError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customBrandName, logoUrl, customDomain, whiteLabelEnabled }),
      });
      if (res.ok) {
        setBrandingSaved(true);
        setTimeout(() => setBrandingSaved(false), 2000);
      } else {
        const data = await res.json();
        setBrandingError(data.error || "Failed to save branding settings");
      }
    } catch {
      setBrandingError("Something went wrong");
    }
    setBrandingSaving(false);
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

  const isAgency = plan === "AGENCY";

  const tabs = [
    { id: "workspace", label: "Workspace", icon: Settings },
    { id: "branding", label: "Branding", icon: Paintbrush, agencyOnly: true },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your workspace configuration</p>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            } ${tab.agencyOnly && !isAgency ? "opacity-50" : ""}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.agencyOnly && !isAgency && (
              <Crown className="w-3 h-3 text-amber-500" />
            )}
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

      {activeTab === "branding" && (
        <div className="space-y-4">
          {!isAgency ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 text-center">
              <Crown className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 text-lg">White-Label Branding</h3>
              <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
                Customize your platform with your own brand name, logo, and domain.
                Your clients see your brand — not ours.
              </p>
              <p className="text-amber-700 text-sm font-medium mt-3">Available on the Agency plan ($79/mo)</p>
              <a
                href="/billing"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Agency
              </a>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">White-Label Branding</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Your clients see your brand on reports, exports, and the dashboard</p>
                  </div>
                  <button
                    onClick={() => setWhiteLabelEnabled(!whiteLabelEnabled)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      whiteLabelEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {whiteLabelEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {whiteLabelEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                <div className={whiteLabelEnabled ? "" : "opacity-50 pointer-events-none"}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        <span className="flex items-center gap-2">
                          <Paintbrush className="w-4 h-4 text-slate-400" />
                          Brand Name
                        </span>
                      </label>
                      <input
                        type="text"
                        value={customBrandName}
                        onChange={e => setCustomBrandName(e.target.value)}
                        placeholder="Your Agency Name"
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-slate-400 mt-1">Appears in PDF reports, exports, and dashboard header</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        <span className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-slate-400" />
                          Logo URL
                        </span>
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="https://yourdomain.com/logo.png"
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-slate-400 mt-1">Used in the sidebar and exported files. Recommended: 200x50px PNG with transparency.</p>
                    </div>

                    {logoUrl && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs text-slate-500">Preview:</span>
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="h-8 max-w-[160px] object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400" />
                          Custom Domain
                        </span>
                      </label>
                      <input
                        type="text"
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="dashboard.youragency.com"
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Point your domain CNAME to this platform. Shown in exported reports and footers.
                      </p>
                    </div>
                  </div>
                </div>

                {brandingError && (
                  <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-rose-50 text-rose-700">
                    <AlertCircle className="w-4 h-4" />
                    {brandingError}
                  </div>
                )}

                <button
                  onClick={saveBranding}
                  disabled={brandingSaving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {brandingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : brandingSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {brandingSaved ? "Saved!" : "Save Branding"}
                </button>
              </div>

              {/* Preview Card */}
              {whiteLabelEnabled && customBrandName && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Preview</h3>
                  <p className="text-slate-500 text-sm mb-4">This is how your brand appears to clients</p>

                  {/* Mini preview of PDF header */}
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold text-lg">{customBrandName.toUpperCase()}</div>
                        <div className="text-indigo-200 text-xs mt-0.5">Business Diagnostics Report</div>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                        <span className="text-emerald-500 font-bold text-xl">85</span>
                      </div>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 text-xs text-slate-400 text-center">
                      Generated by {customBrandName}{customDomain ? ` — ${customDomain}` : ""}
                    </div>
                  </div>
                </div>
              )}
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
