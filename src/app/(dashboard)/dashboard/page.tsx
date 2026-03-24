import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, FileText, Target, TrendingUp, Zap, Clock } from "lucide-react";

async function getDashboardData(userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId },
    include: {
      workspace: {
        include: {
          businessProfiles: {
            include: {
              auditRuns: { orderBy: { createdAt: "desc" }, take: 1 },
              repairPlans: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
          subscription: true,
          usageMeters: { where: { month: new Date().toISOString().slice(0, 7) }, take: 1 },
        },
      },
    },
  });
  return membership;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const membership = await getDashboardData(user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  const workspace = membership.workspace;
  const businesses = workspace.businessProfiles;
  const usage = workspace.usageMeters[0];
  const latestAudit = businesses[0]?.auditRuns[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back to {workspace.name}</p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Zap className="w-4 h-4" />
          New Business
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
              {workspace.plan}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{businesses.length}</p>
          <p className="text-sm text-slate-500">Businesses</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{usage?.auditsUsed || 0}</p>
          <p className="text-sm text-slate-500">Audits this month</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {latestAudit?.overallScore ?? "\u2014"}
          </p>
          <p className="text-sm text-slate-500">Latest audit score</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{usage?.exportsUsed || 0}</p>
          <p className="text-sm text-slate-500">Exports generated</p>
        </div>
      </div>

      {/* Business List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">Your Businesses</h2>
        </div>
        {businesses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No businesses yet</h3>
            <p className="text-sm text-slate-400 mb-4">Add your first business to get started with AI diagnostics.</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Zap className="w-4 h-4" /> Add Business
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {businesses.map((biz) => {
              const lastAudit = biz.auditRuns[0];
              const score = lastAudit?.overallScore;
              return (
                <Link
                  key={biz.id}
                  href={`/business/${biz.id}`}
                  className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {biz.name[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{biz.name}</h3>
                      <p className="text-sm text-slate-400">{biz.industry} · {biz.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {score !== null && score !== undefined ? (
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        score >= 70 ? "bg-emerald-50 text-emerald-700" :
                        score >= 40 ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      }`}>
                        <BarChart3 className="w-3.5 h-3.5" />
                        {score}/100
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> No audit yet
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
          <Target className="w-8 h-8 mb-3 text-indigo-200" />
          <h3 className="font-semibold mb-1">Run an Audit</h3>
          <p className="text-sm text-indigo-100 mb-3">Get a complete diagnosis of your business health.</p>
          <Link href="/onboarding" className="inline-flex items-center gap-1 text-sm font-medium text-white hover:underline">
            Start now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
          <FileText className="w-8 h-8 mb-3 text-purple-200" />
          <h3 className="font-semibold mb-1">Generate Assets</h3>
          <p className="text-sm text-purple-100 mb-3">Create ads, emails, scripts, and website copy.</p>
          <Link href="/assets" className="inline-flex items-center gap-1 text-sm font-medium text-white hover:underline">
            View assets <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <BarChart3 className="w-8 h-8 mb-3 text-slate-400" />
          <h3 className="font-semibold mb-1">Track Progress</h3>
          <p className="text-sm text-slate-300 mb-3">Monitor your repair plan tasks and milestones.</p>
          <Link href="/plans" className="inline-flex items-center gap-1 text-sm font-medium text-white hover:underline">
            View plans <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
