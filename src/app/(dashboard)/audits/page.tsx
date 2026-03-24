import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, Search, Target } from "lucide-react";

export default async function AuditsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          businessProfiles: {
            include: {
              auditRuns: { orderBy: { createdAt: "desc" }, include: { findings: true } },
            },
          },
        },
      },
    },
  });

  if (!membership) redirect("/onboarding");

  const allAudits = membership.workspace.businessProfiles.flatMap((biz) =>
    biz.auditRuns.map((audit) => ({ ...audit, businessName: biz.name, businessId: biz.id, industry: biz.industry }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audits</h1>
        <p className="text-slate-500 text-sm mt-1">All diagnostic audits across your businesses</p>
      </div>

      {allAudits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No audits yet</h3>
          <p className="text-sm text-slate-400 mb-4">Run your first audit from a business profile.</p>
          <Link href="/onboarding" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Search className="w-4 h-4" /> Add a Business
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {allAudits.map((audit) => (
            <Link
              key={audit.id}
              href={`/business/${audit.businessId}/audit/${audit.id}`}
              className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                  audit.status === "COMPLETED"
                    ? (audit.overallScore ?? 0) >= 70 ? "bg-emerald-50 text-emerald-700" : (audit.overallScore ?? 0) >= 40 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                    : audit.status === "RUNNING" ? "bg-blue-50 text-blue-700"
                    : audit.status === "FAILED" ? "bg-red-50 text-red-700"
                    : "bg-slate-50 text-slate-700"
                }`}>
                  {audit.status === "COMPLETED" ? audit.overallScore : audit.status === "RUNNING" ? "..." : "—"}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{audit.businessName}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{audit.industry}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(audit.createdAt).toLocaleDateString()}</span>
                    <span>{audit.findings.length} findings</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  audit.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                  audit.status === "RUNNING" ? "bg-blue-50 text-blue-700" :
                  audit.status === "FAILED" ? "bg-red-50 text-red-700" :
                  "bg-slate-50 text-slate-700"
                }`}>
                  {audit.status}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
