import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, Building2, BarChart3, CreditCard, Shield, Activity } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user?.isAdmin) redirect("/dashboard");

  const [userCount, workspaceCount, businessCount, auditCount, activeSubCount, recentLogs] = await Promise.all([
    db.user.count(),
    db.workspace.count(),
    db.businessProfile.count(),
    db.auditRun.count(),
    db.subscription.count({ where: { status: "active" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: true } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">System overview and management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Users", value: userCount, icon: Users, color: "blue" },
          { label: "Workspaces", value: workspaceCount, icon: Building2, color: "violet" },
          { label: "Businesses", value: businessCount, icon: BarChart3, color: "green" },
          { label: "Audits", value: auditCount, icon: Activity, color: "orange" },
          { label: "Active Subs", value: activeSubCount, icon: CreditCard, color: "emerald" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <stat.icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
          {recentLogs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-400">
                  {log.user?.email || "System"} · {log.target || ""} · {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {recentLogs.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No activity logs yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
