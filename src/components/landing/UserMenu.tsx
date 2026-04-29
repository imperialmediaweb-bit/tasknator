"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const initials = (name?.charAt(0) || email?.charAt(0) || "U").toUpperCase();

  return (
    <div className="flex items-center gap-3 pl-4 border-l border-white/20">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
        {initials}
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-sm font-medium text-white">{name}</span>
        <span className="text-xs text-white/80">{email}</span>
      </div>
      <button
        onClick={handleLogout}
        className="p-1.5 text-white/70 hover:text-white transition-colors"
        title="Logout"
        aria-label="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
