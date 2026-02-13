"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Building2, BarChart3, CreditCard, ShieldCheck, Activity,
  Key, ArrowLeft, Zap, CheckCircle2, AlertCircle, Globe, Save,
  Crown, Mail, Calendar, Search, RefreshCw, Settings2, Loader2
} from "lucide-react";

type AdminUser = {
  id: string; name: string | null; email: string; isAdmin: boolean;
  createdAt: string; workspace: string | null; plan: string | null;
  role: string | null; subscriptionStatus: string | null;
};

type TabId = "overview" | "users" | "subscriptions" | "apikeys";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "apikeys", label: "Platform Config", icon: Key },
];

const API_KEY_FIELDS = [
  { key: "ANTHROPIC_API_KEY", label: "Anthropic Claude", desc: "Claude 4.5 Sonnet - primary AI provider", group: "AI Providers" },
  { key: "OPENAI_API_KEY", label: "OpenAI", desc: "GPT-4o - fallback AI provider", group: "AI Providers" },
  { key: "GEMINI_API_KEY", label: "Google Gemini", desc: "Gemini 2.0 Pro - fallback AI provider", group: "AI Providers" },
  { key: "GOOGLE_CLIENT_ID", label: "Google Client ID", desc: "For Google OAuth login", group: "Google OAuth" },
  { key: "GOOGLE_CLIENT_SECRET", label: "Google Client Secret", desc: "For Google OAuth login", group: "Google OAuth" },
  { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", desc: "For payment processing", group: "Payments" },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe Webhook Secret", desc: "For Stripe webhook verification", group: "Payments" },
  { key: "PAYPAL_CLIENT_ID", label: "PayPal Client ID", desc: "For PayPal payment processing", group: "Payments" },
  { key: "PAYPAL_CLIENT_SECRET", label: "PayPal Client Secret", desc: "For PayPal payment processing", group: "Payments" },
  { key: "PAYPAL_WEBHOOK_ID", label: "PayPal Webhook ID", desc: "For PayPal webhook verification", group: "Payments" },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
  const [configInputs, setConfigInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, workspaces: 0, businesses: 0, audits: 0, activeSubs: 0 });
  const [searchUser, setSearchUser] = useState("");

  const isAdmin = (session?.user as any)?.isAdmin;

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.email || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    loadAll();
  }, [status]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadUsers(), loadConfig(), loadStats()]);
    setLoading(false);
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch {}
  }

  async function loadConfig() {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || {});
        setEnvStatus(data.envStatus || {});
      }
    } catch {}
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data: AdminUser[] = await res.json();
        const activeSubs = data.filter(u => u.subscriptionStatus === "active").length;
        const workspaces = new Set(data.map(u => u.workspace).filter(Boolean)).size;
        setStats({
          users: data.length,
          workspaces,
          businesses: 0,
          audits: 0,
          activeSubs,
        });
      }
    } catch {}
  }

  async function saveConfigKey(key: string) {
    const value = configInputs[key];
    if (!value) return;
    setSaving(key);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSaved(key);
        setConfigInputs(prev => ({ ...prev, [key]: "" }));
        await loadConfig();
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {}
    setSaving(null);
  }

  async function toggleAdmin(userId: string, currentAdmin: boolean) {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentAdmin }),
      });
      await loadUsers();
    } catch {}
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    !searchUser || u.email.toLowerCase().includes(searchUser.toLowerCase()) || u.name?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const subs = users.filter(u => u.subscriptionStatus);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500">Manage platform, users, and configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.users, icon: Users, color: "indigo" },
              { label: "Workspaces", value: stats.workspaces, icon: Building2, color: "purple" },
              { label: "Active Subs", value: stats.activeSubs, icon: CreditCard, color: "emerald" },
              { label: "Plans Configured", value: Object.values(envStatus).filter(Boolean).length + "/" + Object.keys(envStatus).length, icon: Key, color: "amber" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 text-${s.color}-600`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick status cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-2xl p-5 border ${envStatus.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">AI Provider</h3>
                {envStatus.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <p className="text-sm text-slate-600">
                {envStatus.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY
                  ? "AI audits are fully operational"
                  : "No AI keys configured. Go to Platform Config to add."}
              </p>
            </div>

            <div className={`rounded-2xl p-5 border ${envStatus.GOOGLE_CLIENT_ID || config.GOOGLE_CLIENT_ID ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">Google OAuth</h3>
                {envStatus.GOOGLE_CLIENT_ID || config.GOOGLE_CLIENT_ID ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-slate-600">
                {envStatus.GOOGLE_CLIENT_ID || config.GOOGLE_CLIENT_ID
                  ? "Google sign-in is enabled"
                  : "Google login disabled. Add credentials in Platform Config."}
              </p>
            </div>

            <div className={`rounded-2xl p-5 border ${envStatus.STRIPE_SECRET_KEY || config.STRIPE_SECRET_KEY ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">Payments</h3>
                {config.STRIPE_SECRET_KEY ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-slate-600">
                {config.STRIPE_SECRET_KEY
                  ? "Stripe payments are connected"
                  : "Stripe not configured. Set up in Platform Config."}
              </p>
            </div>
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-5 border-b border-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {users.slice(0, 5).map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium">
                      {u.name?.[0] || u.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{u.name || "Unnamed"}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.isAdmin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">ADMIN</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      u.plan === "AGENCY" ? "bg-purple-50 text-purple-700" :
                      u.plan === "PRO" ? "bg-indigo-50 text-indigo-700" :
                      "bg-slate-50 text-slate-600"
                    }`}>{u.plan || "FREE"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">All Users ({users.length})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                placeholder="Search users..."
                className="h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Workspace</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Subscription</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Joined</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {u.name?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.name || "Unnamed"}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{u.workspace || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.plan === "AGENCY" ? "bg-purple-50 text-purple-700" :
                        u.plan === "PRO" ? "bg-indigo-50 text-indigo-700" :
                        u.plan === "STARTER" ? "bg-slate-50 text-slate-600" :
                        "bg-slate-50 text-slate-400"
                      }`}>
                        {u.plan || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === "OWNER" ? "bg-amber-50 text-amber-700" :
                        u.role === "ADMIN" ? "bg-indigo-50 text-indigo-700" :
                        "bg-slate-50 text-slate-600"
                      }`}>
                        {u.role || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-700" :
                        u.subscriptionStatus ? "bg-amber-50 text-amber-700" :
                        "bg-slate-50 text-slate-400"
                      }`}>
                        {u.subscriptionStatus || "None"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleAdmin(u.id, u.isAdmin)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          u.isAdmin
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {u.isAdmin ? "Remove Admin" : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No users found</div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SUBSCRIPTIONS TAB ═══ */}
      {tab === "subscriptions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["STARTER", "PRO", "AGENCY"].map(plan => {
              const count = users.filter(u => u.plan === plan).length;
              const activeCount = users.filter(u => u.plan === plan && u.subscriptionStatus === "active").length;
              return (
                <div key={plan} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      plan === "AGENCY" ? "bg-purple-100 text-purple-700" :
                      plan === "PRO" ? "bg-indigo-100 text-indigo-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{plan}</span>
                    <Crown className={`w-5 h-5 ${
                      plan === "AGENCY" ? "text-purple-400" :
                      plan === "PRO" ? "text-indigo-400" :
                      "text-slate-300"
                    }`} />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{count}</p>
                  <p className="text-sm text-slate-500">users on this plan</p>
                  <div className="mt-2 text-xs text-emerald-600 font-medium">{activeCount} active subscription{activeCount !== 1 ? "s" : ""}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">All Subscriptions</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Workspace</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.filter(u => u.plan).map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {u.name?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.name || "Unnamed"}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{u.workspace || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        u.plan === "AGENCY" ? "bg-purple-100 text-purple-700" :
                        u.plan === "PRO" ? "bg-indigo-100 text-indigo-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{u.plan}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-700" :
                        u.subscriptionStatus ? "bg-amber-50 text-amber-700" :
                        "bg-slate-50 text-slate-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.subscriptionStatus === "active" ? "bg-emerald-500" :
                          u.subscriptionStatus ? "bg-amber-500" :
                          "bg-slate-300"
                        }`} />
                        {u.subscriptionStatus || "None"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.filter(u => u.plan).length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No subscriptions yet</div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PLATFORM CONFIG TAB ═══ */}
      {tab === "apikeys" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-sm text-indigo-900 font-medium">Platform Configuration</p>
            <p className="text-sm text-indigo-700 mt-0.5">
              Set API keys here so users don&apos;t need their own. Values saved in database override environment variables.
              Green = configured (env or DB), red = missing.
            </p>
          </div>

          {["AI Providers", "Google OAuth", "Payments"].map(group => (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{group}</h3>
              {API_KEY_FIELDS.filter(f => f.group === group).map(field => {
                const hasEnv = envStatus[field.key];
                const hasDb = !!config[field.key];
                const isConfigured = hasEnv || hasDb;

                return (
                  <div key={field.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{field.label}</h4>
                          {isConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{field.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasEnv && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">ENV</span>
                        )}
                        {hasDb && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">DB: {config[field.key]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={configInputs[field.key] || ""}
                        onChange={e => setConfigInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={isConfigured ? "Enter new value to override..." : `Enter ${field.label}...`}
                        className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => saveConfigKey(field.key)}
                        disabled={!configInputs[field.key] || saving === field.key}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                      >
                        {saving === field.key ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saved === field.key ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
                        ) : (
                          <><Save className="w-3.5 h-3.5" /> Save</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
