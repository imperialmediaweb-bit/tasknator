import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, FileText } from "lucide-react";

export default async function PlansPage() {
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
              repairPlans: {
                orderBy: { createdAt: "desc" },
                include: { tasks: true },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) redirect("/onboarding");

  const allPlans = membership.workspace.businessProfiles.flatMap((biz) =>
    biz.repairPlans.map((plan) => ({
      ...plan,
      businessName: biz.name,
      businessId: biz.id,
      industry: biz.industry,
      totalTasks: plan.tasks.length,
      completedTasks: plan.tasks.filter((t) => t.completed).length,
    }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Repair Plans</h1>
        <p className="text-slate-500 text-sm mt-1">All 30/60/90-day recovery plans</p>
      </div>

      {allPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No repair plans yet</h3>
          <p className="text-sm text-slate-400 mb-4">Generate a plan after running an audit on a business.</p>
          <Link href="/onboarding" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            Add a Business
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {allPlans.map((plan) => {
            const pct = plan.totalTasks > 0 ? Math.round((plan.completedTasks / plan.totalTasks) * 100) : 0;
            return (
              <Link
                key={plan.id}
                href={`/business/${plan.businessId}/plan/${plan.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{plan.title}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{plan.businessName} · {plan.industry}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{plan.summary}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{pct}%</p>
                      <p className="text-xs text-slate-400">{plan.completedTasks}/{plan.totalTasks} tasks</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(plan.createdAt).toLocaleDateString()}</span>
                  {plan.completedTasks === plan.totalTasks && plan.totalTasks > 0 && (
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
