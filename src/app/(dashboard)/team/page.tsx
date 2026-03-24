"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, Shield, Mail, Loader2 } from "lucide-react";
import { InviteButton, MemberMenu } from "./team-actions";

type Member = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

type TeamData = {
  members: Member[];
  currentUserId: string;
  isOwnerOrAdmin: boolean;
  plan: string;
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      const res = await fetch("/api/team/info");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {}
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Unable to load team data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 text-sm mt-1">Manage workspace members and roles</p>
        </div>
        {data.isOwnerOrAdmin && (
          <InviteButton onInvited={loadTeam} />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-slate-400" />
            Members ({data.members.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {data.members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-medium">
                  {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.user.name || "Unnamed"}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  member.role === "OWNER" ? "bg-amber-50 text-amber-700" :
                  member.role === "ADMIN" ? "bg-indigo-50 text-indigo-700" :
                  member.role === "MEMBER" ? "bg-slate-50 text-slate-700" :
                  "bg-slate-50 text-slate-500"
                }`}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  {member.role}
                </span>
                {data.isOwnerOrAdmin && (
                  <MemberMenu
                    member={member}
                    currentUserId={data.currentUserId}
                    onUpdate={loadTeam}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.plan !== "AGENCY" && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 text-center">
          <h3 className="font-semibold text-slate-900 mb-1">Need more team members?</h3>
          <p className="text-sm text-slate-600 mb-3">Upgrade to the Agency plan for up to 25 team members.</p>
          <a href="/billing" className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline">
            View plans
          </a>
        </div>
      )}
    </div>
  );
}
