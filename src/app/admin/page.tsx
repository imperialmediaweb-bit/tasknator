import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Building2, BarChart3, CreditCard, ShieldCheck, Activity,
  Key, ArrowLeft, Zap, CheckCircle2, AlertCircle, Globe
} from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user?.isAdmin) redirect("/dashboard");

  const [
    userCount, workspaceCount, businessCount, auditCount,
    activeSubCount, recentLogs, allUsers, allWorkspaces
  ] = await Promise.all([
    db.user.count(),
    db.workspace.count(),
    db.businessProfile.count(),
    db.auditRun.count(),
    db.subscription.count({ where: { status: "active" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { memberships: { include: { workspace: true }, take: 1 } },
    }),
    db.workspace.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        memberships: { include: { user: true } },
        subscription: true,
        _count: { select: { businessProfiles: true, providerKeys: true } },
      },
    }),
  ]);

  // Check platform API keys status
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const platformKeysCount = [hasAnthropicKey, hasOpenAIKey, hasGeminiKey].filter(Boolean).length;

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
            <p className="text-sm text-slate-500">System overview and management</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <Users className="w-5 h-5 text-indigo-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{userCount}</p>
          <p className="text-sm text-slate-500">Users</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <Building2 className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{workspaceCount}</p>
          <p className="text-sm text-slate-500">Workspaces</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <BarChart3 className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{businessCount}</p>
          <p className="text-sm text-slate-500">Businesses</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <Activity className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{auditCount}</p>
          <p className="text-sm text-slate-500">Audits</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <CreditCard className="w-5 h-5 text-rose-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{activeSubCount}</p>
          <p className="text-sm text-slate-500">Active Subs</p>
        </div>
      </div>

      {/* Platform API Keys */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Platform API Keys</h2>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            platformKeysCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}>
            {platformKeysCount}/3 configured
          </span>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-500 mb-4">
            These platform-level keys (from environment variables) are used as fallback for all workspaces.
            Users don&apos;t need to add their own keys when these are set.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Anthropic Claude", key: "ANTHROPIC_API_KEY", active: hasAnthropicKey },
              { name: "OpenAI GPT", key: "OPENAI_API_KEY", active: hasOpenAIKey },
              { name: "Google Gemini", key: "GEMINI_API_KEY", active: hasGeminiKey },
            ].map((provider) => (
              <div key={provider.key} className={`rounded-xl p-4 border ${
                provider.active
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/50"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-slate-900">{provider.name}</h4>
                  {provider.active ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500">{provider.key}</p>
                <p className={`text-xs mt-1 font-medium ${
                  provider.active ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {provider.active ? "Active" : "Not configured"}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Set these in Railway environment variables to enable AI features for all users without individual API keys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Users</h2>
            </div>
            <span className="text-xs text-slate-400">{userCount} total</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {allUsers.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium">
                    {u.name?.[0] || u.email[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.name || "Unnamed"}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.isAdmin && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">ADMIN</span>
                  )}
                  <span className="text-xs text-slate-400">
                    {u.memberships[0]?.workspace?.plan || "No workspace"}
                  </span>
                </div>
              </div>
            ))}
            {allUsers.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No users yet</div>
            )}
          </div>
        </div>

        {/* Workspaces */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Workspaces</h2>
            </div>
            <span className="text-xs text-slate-400">{workspaceCount} total</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {allWorkspaces.map((ws) => (
              <div key={ws.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">{ws.name}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    ws.plan === "AGENCY" ? "bg-purple-50 text-purple-700" :
                    ws.plan === "PRO" ? "bg-indigo-50 text-indigo-700" :
                    "bg-slate-50 text-slate-600"
                  }`}>
                    {ws.plan}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{ws.memberships.length} member{ws.memberships.length !== 1 ? "s" : ""}</span>
                  <span>{ws._count.businessProfiles} business{ws._count.businessProfiles !== 1 ? "es" : ""}</span>
                  {ws._count.providerKeys > 0 && (
                    <span className="flex items-center gap-0.5"><Key className="w-3 h-3" /> {ws._count.providerKeys} key{ws._count.providerKeys !== 1 ? "s" : ""}</span>
                  )}
                  <span className={`${ws.subscription?.status === "active" ? "text-emerald-500" : "text-slate-300"}`}>
                    {ws.subscription?.status === "active" ? "Active sub" : "No sub"}
                  </span>
                </div>
              </div>
            ))}
            {allWorkspaces.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No workspaces yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
          {recentLogs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{log.action}</p>
                <p className="text-xs text-slate-400">
                  {log.user?.email || "System"} {log.target ? `\u00B7 ${log.target}` : ""} {"\u00B7"} {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {recentLogs.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">No activity logs yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
