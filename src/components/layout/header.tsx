"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search businesses, audits, assets..."
            className="w-full h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{session?.user?.name || "User"}</p>
            <p className="text-xs text-slate-400">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
