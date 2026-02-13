import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Clock, Download, FileText, Sparkles, TrendingUp } from "lucide-react";

export default async function PlanDetailPage({
  params,
}: {
  params: { id: string; planId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const plan = await db.repairPlan.findUnique({
    where: { id: params.planId },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
      assets: { include: { versions: true } },
      businessProfile: true,
    },
  });

  if (!plan) notFound();

  const phases = [
    { key: "DAY_30", label: "Day 30 - Quick Wins", color: "blue" },
    { key: "DAY_60", label: "Day 60 - Build Momentum", color: "violet" },
    { key: "DAY_90", label: "Day 90 - Scale & Optimize", color: "green" },
  ] as const;

  const totalTasks = plan.tasks.length;
  const completedTasks = plan.tasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/business/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to business
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{plan.businessProfile.name} · {plan.businessProfile.industry}</p>
          </div>
          <a
            href={`/api/export/${plan.id}?format=zip`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export ZIP
          </a>
        </div>
      </div>

      {/* Summary & Progress */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Plan Summary</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{plan.summary}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-5 text-white">
          <h3 className="font-medium text-blue-100 mb-1">Progress</h3>
          <p className="text-4xl font-bold mb-2">{progressPercent}%</p>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-sm text-blue-100 mt-2">{completedTasks} of {totalTasks} tasks done</p>
        </div>
      </div>

      {/* Tasks by Phase */}
      {phases.map(({ key, label, color }) => {
        const phaseTasks = plan.tasks.filter((t) => t.phase === key);
        if (phaseTasks.length === 0) return null;

        return (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-50">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className={`w-5 h-5 text-${color}-500`} />
                {label}
                <span className="text-sm font-normal text-gray-400">
                  ({phaseTasks.filter((t) => t.completed).length}/{phaseTasks.length})
                </span>
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {phaseTasks.map((task) => (
                <div key={task.id} className="p-4 flex items-start gap-3">
                  <div className="mt-0.5">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {task.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.impact === "high" ? "bg-red-50 text-red-700" :
                        task.impact === "medium" ? "bg-yellow-50 text-yellow-700" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        {task.impact} impact
                      </span>
                      {task.timeEstimate && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.timeEstimate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Generated Assets */}
      {plan.assets.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Generated Assets
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {plan.assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-400 uppercase">{asset.type.replace(/_/g, " ")}</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900">{asset.title}</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {asset.versions.length} version{asset.versions.length !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
