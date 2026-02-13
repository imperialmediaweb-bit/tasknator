"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Building2, BarChart3, CreditCard, ShieldCheck, Activity,
  Key, ArrowLeft, Zap, CheckCircle2, AlertCircle, Globe, Save,
  Crown, Mail, Calendar, Search, RefreshCw, Settings2, Loader2,
  Plus, Trash2, Eye, EyeOff, Edit3, GripVertical, ExternalLink,
  FileText, Send
} from "lucide-react";

type AdminUser = {
  id: string; name: string | null; email: string; isAdmin: boolean;
  createdAt: string; workspace: string | null; plan: string | null;
  role: string | null; subscriptionStatus: string | null;
};

type TabId = "overview" | "users" | "subscriptions" | "apikeys" | "homepage" | "blog" | "menus" | "pages" | "email";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "subscriptions", label: "Subs", icon: CreditCard },
  { id: "apikeys", label: "Config", icon: Key },
  { id: "homepage", label: "Homepage", icon: Globe },
  { id: "blog", label: "Blog", icon: Activity },
  { id: "menus", label: "Menus", icon: Settings2 },
  { id: "pages", label: "Pages", icon: Activity },
  { id: "email", label: "Email", icon: Mail },
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

  // Homepage state
  const [homepageConfig, setHomepageConfig] = useState<Record<string, string>>({});
  const [hpSaving, setHpSaving] = useState(false);

  // Blog state
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [blogForm, setBlogForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "General", published: false });

  // Menus state
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuForm, setMenuForm] = useState({ location: "HEADER", label: "", href: "", openNew: false });

  // Pages state
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageForm, setPageForm] = useState({ title: "", slug: "", content: "", metaTitle: "", metaDesc: "", published: false });

  // Email state
  const [emailConfig, setEmailConfig] = useState<Record<string, string>>({});
  const [emailEnvStatus, setEmailEnvStatus] = useState<Record<string, boolean>>({});
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSaved, setEmailSaved] = useState<string | null>(null);

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
    await Promise.all([loadUsers(), loadConfig(), loadStats(), loadBlog(), loadMenus(), loadPages(), loadEmailConfig(), loadHomepageConfig()]);
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

  // Homepage
  async function loadHomepageConfig() {
    try { const r = await fetch("/api/admin/homepage"); if (r.ok) setHomepageConfig(await r.json()); } catch {}
  }
  async function saveHomepageField(key: string, value: string) {
    setHpSaving(true);
    try { await fetch("/api/admin/homepage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) }); await loadHomepageConfig(); } catch {}
    setHpSaving(false);
  }

  // Blog
  async function loadBlog() {
    try { const r = await fetch("/api/admin/blog"); if (r.ok) setBlogPosts(await r.json()); } catch {}
  }
  async function saveBlogPost() {
    const method = editingPost ? "PATCH" : "POST";
    const body = editingPost ? { id: editingPost.id, ...blogForm } : blogForm;
    try {
      const r = await fetch("/api/admin/blog", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { setBlogForm({ title: "", slug: "", excerpt: "", content: "", category: "General", published: false }); setEditingPost(null); await loadBlog(); }
      else { const d = await r.json(); alert(d.error || "Error saving"); }
    } catch {}
  }
  async function deleteBlogPost(id: string) {
    if (!confirm("Delete this post?")) return;
    try { await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" }); await loadBlog(); } catch {}
  }
  async function toggleBlogPublish(post: any) {
    try { await fetch("/api/admin/blog", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id, published: !post.published, publishedAt: !post.published ? new Date().toISOString() : null }) }); await loadBlog(); } catch {}
  }

  // Menus
  async function loadMenus() {
    try { const r = await fetch("/api/admin/menus"); if (r.ok) setMenuItems(await r.json()); } catch {}
  }
  async function addMenuItem() {
    if (!menuForm.label || !menuForm.href) return;
    try {
      const r = await fetch("/api/admin/menus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(menuForm) });
      if (r.ok) { setMenuForm({ location: "HEADER", label: "", href: "", openNew: false }); await loadMenus(); }
    } catch {}
  }
  async function deleteMenuItem(id: string) {
    try { await fetch(`/api/admin/menus?id=${id}`, { method: "DELETE" }); await loadMenus(); } catch {}
  }
  async function toggleMenuVisible(item: any) {
    try { await fetch("/api/admin/menus", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, visible: !item.visible }) }); await loadMenus(); } catch {}
  }

  // Pages
  async function loadPages() {
    try { const r = await fetch("/api/admin/pages"); if (r.ok) setCustomPages(await r.json()); } catch {}
  }
  async function saveCustomPage() {
    const method = editingPage ? "PATCH" : "POST";
    const body = editingPage ? { id: editingPage.id, ...pageForm } : pageForm;
    try {
      const r = await fetch("/api/admin/pages", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { setPageForm({ title: "", slug: "", content: "", metaTitle: "", metaDesc: "", published: false }); setEditingPage(null); await loadPages(); }
      else { const d = await r.json(); alert(d.error || "Error saving"); }
    } catch {}
  }
  async function deleteCustomPage(id: string) {
    if (!confirm("Delete this page?")) return;
    try { await fetch(`/api/admin/pages?id=${id}`, { method: "DELETE" }); await loadPages(); } catch {}
  }

  // Email
  async function loadEmailConfig() {
    try { const r = await fetch("/api/admin/email"); if (r.ok) { const d = await r.json(); setEmailConfig(d.config || {}); setEmailEnvStatus(d.envStatus || {}); } } catch {}
  }
  async function saveEmailField(key: string) {
    const value = emailInputs[key];
    if (!value) return;
    try {
      const r = await fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
      if (r.ok) { setEmailSaved(key); setEmailInputs(p => ({ ...p, [key]: "" })); await loadEmailConfig(); setTimeout(() => setEmailSaved(null), 2000); }
    } catch {}
  }
  async function sendTestEmail() {
    if (!testEmail) return;
    setEmailSending(true);
    try {
      const r = await fetch("/api/admin/email", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: testEmail }) });
      const d = await r.json();
      if (r.ok) alert("Test email sent!"); else alert(d.error || "Failed to send");
    } catch { alert("Network error"); }
    setEmailSending(false);
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
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
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

      {/* ═══ HOMEPAGE TAB ═══ */}
      {tab === "homepage" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-900 font-medium">Homepage Editor</p>
            <p className="text-sm text-blue-700 mt-0.5">Customize the landing page hero text and toggle sections on/off.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Hero Section</h3>
            {[
              { key: "HOMEPAGE_HERO_TITLE", label: "Hero Title", placeholder: "AI That Fixes Business Bottlenecks" },
              { key: "HOMEPAGE_HERO_SUBTITLE", label: "Hero Subtitle", placeholder: "One audit. A full recovery plan..." },
              { key: "HOMEPAGE_HERO_CTA", label: "CTA Button Text", placeholder: "Start Free Audit" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}</label>
                <div className="flex gap-2">
                  <input
                    value={homepageConfig[f.key] || ""}
                    onChange={e => setHomepageConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={() => saveHomepageField(f.key, homepageConfig[f.key] || "")} disabled={hpSaving} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Section Visibility</h3>
            {[
              { key: "HOMEPAGE_STATS_ENABLED", label: "Stats Bar" },
              { key: "HOMEPAGE_FEATURES_ENABLED", label: "Features Grid" },
              { key: "HOMEPAGE_TESTIMONIALS_ENABLED", label: "Testimonials" },
              { key: "HOMEPAGE_PRICING_ENABLED", label: "Pricing" },
              { key: "HOMEPAGE_FAQ_ENABLED", label: "FAQ" },
              { key: "HOMEPAGE_NEWSLETTER_ENABLED", label: "Newsletter" },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{s.label}</span>
                <button
                  onClick={() => {
                    const newVal = homepageConfig[s.key] === "false" ? "true" : homepageConfig[s.key] === "true" ? "false" : "false";
                    setHomepageConfig(prev => ({ ...prev, [s.key]: newVal }));
                    saveHomepageField(s.key, newVal);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${homepageConfig[s.key] !== "false" ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${homepageConfig[s.key] !== "false" ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ BLOG TAB ═══ */}
      {tab === "blog" && (
        <div className="space-y-6">
          {/* Blog form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">{editingPost ? "Edit Post" : "New Blog Post"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
                <input value={blogForm.title} onChange={e => setBlogForm(p => ({ ...p, title: e.target.value, slug: editingPost ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} placeholder="Post title" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Slug</label>
                <input value={blogForm.slug} onChange={e => setBlogForm(p => ({ ...p, slug: e.target.value }))} placeholder="post-slug" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
                <input value={blogForm.category} onChange={e => setBlogForm(p => ({ ...p, category: e.target.value }))} placeholder="General" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Excerpt</label>
                <input value={blogForm.excerpt} onChange={e => setBlogForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short description" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Content (Markdown)</label>
              <textarea value={blogForm.content} onChange={e => setBlogForm(p => ({ ...p, content: e.target.value }))} rows={8} placeholder="Write your post content in markdown..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={blogForm.published} onChange={e => setBlogForm(p => ({ ...p, published: e.target.checked }))} className="rounded border-slate-300" />
                Publish immediately
              </label>
              <div className="flex gap-2">
                {editingPost && (
                  <button onClick={() => { setEditingPost(null); setBlogForm({ title: "", slug: "", excerpt: "", content: "", category: "General", published: false }); }} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                )}
                <button onClick={saveBlogPost} className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> {editingPost ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>

          {/* Blog list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">All Posts ({blogPosts.length})</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {blogPosts.map(post => (
                <div key={post.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-slate-900">{post.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${post.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {post.published ? "Published" : "Draft"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{post.category}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">/blog/{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleBlogPublish(post)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                      {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditingPost(post); setBlogForm({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, category: post.category, published: post.published }); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteBlogPost(post.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {blogPosts.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No blog posts yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MENUS TAB ═══ */}
      {tab === "menus" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
            <p className="text-sm text-violet-900 font-medium">Menu Management</p>
            <p className="text-sm text-violet-700 mt-0.5">Manage header and footer navigation links. These appear on the public landing page and blog.</p>
          </div>

          {/* Add menu item */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Add Menu Item</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Location</label>
                <select value={menuForm.location} onChange={e => setMenuForm(p => ({ ...p, location: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="HEADER">Header</option>
                  <option value="FOOTER">Footer</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Label</label>
                <input value={menuForm.label} onChange={e => setMenuForm(p => ({ ...p, label: e.target.value }))} placeholder="About Us" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">URL / Path</label>
                <input value={menuForm.href} onChange={e => setMenuForm(p => ({ ...p, href: e.target.value }))} placeholder="/page/about" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-end">
                <button onClick={addMenuItem} className="w-full h-10 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={menuForm.openNew} onChange={e => setMenuForm(p => ({ ...p, openNew: e.target.checked }))} className="rounded border-slate-300" />
              Open in new tab
            </label>
          </div>

          {/* Menu items lists */}
          {(["HEADER", "FOOTER"] as const).map(loc => {
            const items = menuItems.filter(i => i.location === loc);
            return (
              <div key={loc} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50">
                  <h2 className="text-lg font-semibold text-slate-900">{loc === "HEADER" ? "Header" : "Footer"} Menu ({items.length})</h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-slate-300" />
                        <div>
                          <span className="text-sm font-medium text-slate-900">{item.label}</span>
                          <span className="text-xs text-slate-400 ml-2">{item.href}</span>
                          {item.openNew && <ExternalLink className="w-3 h-3 inline ml-1 text-slate-300" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleMenuVisible(item)} className={`p-2 rounded-lg hover:bg-slate-100 ${item.visible ? "text-emerald-500" : "text-slate-300"}`}>
                          {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteMenuItem(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="p-6 text-center text-sm text-slate-400">No items yet. Add one above.</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ PAGES TAB ═══ */}
      {tab === "pages" && (
        <div className="space-y-6">
          {/* Page form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">{editingPage ? "Edit Page" : "New Custom Page"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
                <input value={pageForm.title} onChange={e => setPageForm(p => ({ ...p, title: e.target.value, slug: editingPage ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} placeholder="About Us" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Slug (URL: /page/slug)</label>
                <input value={pageForm.slug} onChange={e => setPageForm(p => ({ ...p, slug: e.target.value }))} placeholder="about-us" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Meta Title (SEO)</label>
                <input value={pageForm.metaTitle} onChange={e => setPageForm(p => ({ ...p, metaTitle: e.target.value }))} placeholder="Page title for search engines" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Meta Description (SEO)</label>
                <input value={pageForm.metaDesc} onChange={e => setPageForm(p => ({ ...p, metaDesc: e.target.value }))} placeholder="Short SEO description" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Content (HTML / Markdown)</label>
              <textarea value={pageForm.content} onChange={e => setPageForm(p => ({ ...p, content: e.target.value }))} rows={8} placeholder="Write page content..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={pageForm.published} onChange={e => setPageForm(p => ({ ...p, published: e.target.checked }))} className="rounded border-slate-300" />
                Published
              </label>
              <div className="flex gap-2">
                {editingPage && (
                  <button onClick={() => { setEditingPage(null); setPageForm({ title: "", slug: "", content: "", metaTitle: "", metaDesc: "", published: false }); }} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                )}
                <button onClick={saveCustomPage} className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> {editingPage ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>

          {/* Pages list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">All Pages ({customPages.length})</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {customPages.map(page => (
                <div key={page.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <h4 className="text-sm font-medium text-slate-900">{page.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${page.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {page.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">/page/{page.slug}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingPage(page); setPageForm({ title: page.title, slug: page.slug, content: page.content, metaTitle: page.metaTitle || "", metaDesc: page.metaDesc || "", published: page.published }); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCustomPage(page.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {customPages.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No custom pages yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMAIL TAB ═══ */}
      {tab === "email" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-sm text-emerald-900 font-medium">Email / SMTP Configuration</p>
            <p className="text-sm text-emerald-700 mt-0.5">Configure SMTP settings for transactional emails (audit reports, welcome emails, etc). Supports Mailgun, Gmail, cPanel, SendGrid, or any SMTP provider.</p>
          </div>

          {/* Provider presets */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Quick Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Mailgun", host: "smtp.mailgun.org", port: "587", secure: "false" },
                { name: "Gmail", host: "smtp.gmail.com", port: "465", secure: "true" },
                { name: "SendGrid", host: "smtp.sendgrid.net", port: "587", secure: "false" },
                { name: "cPanel", host: "mail.yourdomain.com", port: "465", secure: "true" },
              ].map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setEmailInputs(p => ({ ...p, SMTP_HOST: preset.host, SMTP_PORT: preset.port, SMTP_SECURE: preset.secure }))}
                  className="p-3 rounded-xl border border-slate-200 text-center hover:bg-slate-50 hover:border-indigo-300 transition-all"
                >
                  <p className="text-sm font-medium text-slate-900">{preset.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{preset.host}</p>
                </button>
              ))}
            </div>
          </div>

          {/* SMTP fields */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">SMTP Settings</h3>
            {[
              { key: "SMTP_HOST", label: "SMTP Host", placeholder: "smtp.mailgun.org", type: "text" },
              { key: "SMTP_PORT", label: "SMTP Port", placeholder: "587", type: "text" },
              { key: "SMTP_SECURE", label: "Use TLS/SSL", placeholder: "true or false", type: "text" },
              { key: "SMTP_USER", label: "SMTP Username", placeholder: "postmaster@mg.yourdomain.com", type: "text" },
              { key: "SMTP_PASS", label: "SMTP Password", placeholder: "Your SMTP password", type: "password" },
              { key: "EMAIL_FROM", label: "From Address", placeholder: "Tasknator <noreply@yourdomain.com>", type: "text" },
            ].map(f => {
              const hasEnv = emailEnvStatus[f.key];
              const hasDb = !!emailConfig[f.key];
              return (
                <div key={f.key}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs font-medium text-slate-500">{f.label}</label>
                    {(hasEnv || hasDb) && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    {hasEnv && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">ENV</span>}
                    {hasDb && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">DB: {f.type === "password" ? "****" : emailConfig[f.key]}</span>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={f.type}
                      value={emailInputs[f.key] || ""}
                      onChange={e => setEmailInputs(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => saveEmailField(f.key)}
                      disabled={!emailInputs[f.key]}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 min-w-[80px] justify-center"
                    >
                      {emailSaved === f.key ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Save</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test email */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Send Test Email</h3>
            <p className="text-xs text-slate-500">Verify your SMTP configuration by sending a test email.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendTestEmail}
                disabled={!testEmail || emailSending}
                className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {emailSending ? "Sending..." : "Send Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
