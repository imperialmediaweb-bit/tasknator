import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, UserPlus, Shield, Mail, MoreVertical } from "lucide-react";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          memberships: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!membership) redirect("/onboarding");

  const members = membership.workspace.memberships;
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(membership.role);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 text-sm mt-1">Manage workspace members and roles</p>
        </div>
        {isOwnerOrAdmin && (
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Members ({members.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-sm font-medium">
                  {member.user.name?.[0] || member.user.email[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.user.name || "Unnamed"}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  member.role === "OWNER" ? "bg-yellow-50 text-yellow-700" :
                  member.role === "ADMIN" ? "bg-blue-50 text-blue-700" :
                  member.role === "MEMBER" ? "bg-gray-50 text-gray-700" :
                  "bg-gray-50 text-gray-500"
                }`}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  {member.role}
                </span>
                {isOwnerOrAdmin && member.userId !== user.id && (
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {membership.workspace.plan !== "AGENCY" && (
        <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-100 p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-1">Need more team members?</h3>
          <p className="text-sm text-gray-600 mb-3">Upgrade to the Agency plan for up to 25 team members.</p>
          <a href="/billing" className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline">
            View plans
          </a>
        </div>
      )}
    </div>
  );
}
