"use client";

import { useState } from "react";
import { UserPlus, MoreVertical, X, Loader2, CheckCircle2, AlertCircle, Trash2, Shield } from "lucide-react";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name: string | null; email: string };
};

export function InviteButton({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function invite() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `${email} has been added to the workspace` });
        setEmail("");
        onInvited();
        setTimeout(() => { setOpen(false); setMessage(null); }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to invite" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Invite Member
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Invite Team Member</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <button
              onClick={invite}
              disabled={loading || !email}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Send Invite
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function MemberMenu({ member, currentUserId, onUpdate }: { member: Member; currentUserId: string; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (member.userId === currentUserId || member.role === "OWNER") return null;

  async function changeRole(newRole: string) {
    setLoading(true);
    try {
      await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: member.id, role: newRole }),
      });
      onUpdate();
    } catch {}
    setLoading(false);
    setOpen(false);
  }

  async function removeMember() {
    if (!confirm("Remove this member from the workspace?")) return;
    setLoading(true);
    try {
      await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: member.id }),
      });
      onUpdate();
    } catch {}
    setLoading(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-44">
            <div className="px-3 py-1.5 text-xs text-slate-400 font-medium">Change Role</div>
            {["ADMIN", "MEMBER", "VIEWER"].filter(r => r !== member.role).map(r => (
              <button
                key={r}
                onClick={() => changeRole(r)}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Make {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={removeMember}
              className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Member
            </button>
          </div>
        </>
      )}
    </div>
  );
}
