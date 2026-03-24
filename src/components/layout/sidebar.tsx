"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Building2, Search, FileText, Palette,
  Settings, CreditCard, Users, ShieldCheck, ChevronLeft, ChevronRight,
  Zap, LogOut, DollarSign
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/onboarding", icon: Building2, label: "Businesses" },
  { href: "/audits", icon: Search, label: "Audits", badge: "AI" },
  { href: "/plans", icon: FileText, label: "Repair Plans" },
  { href: "/assets", icon: Palette, label: "Assets" },
  { href: "/sales-doctor", icon: DollarSign, label: "Sales Doctor" },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = (session?.user as any)?.isAdmin;
  const [branding, setBranding] = useState({ siteName: "Tasknator", logoUrl: "", whiteLabel: false });

  useEffect(() => {
    fetch("/api/branding").then(r => r.json()).then(d => setBranding(d)).catch(() => {});
  }, []);

  const DefaultLogo = () => (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
      <Zap className="w-5 h-5 text-white" />
    </div>
  );

  const Logo = () => branding.logoUrl ? (
    <img src={branding.logoUrl} alt={branding.siteName} className="h-8 max-w-[140px] object-contain" />
  ) : (
    <DefaultLogo />
  );

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-300 sticky top-0`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Logo />
            {(!branding.logoUrl || branding.whiteLabel) && <span className="font-bold text-slate-900 truncate">{branding.siteName}</span>}
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.siteName} className="h-8 w-8 object-contain" />
            ) : (
              <DefaultLogo />
            )}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-indigo-600" : ""}`} />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {/* Admin link - only for admins */}
        {isAdmin && (
          <>
            <div className={`my-2 border-t border-slate-100 ${collapsed ? "mx-1" : ""}`} />
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === "/admin"
                  ? "bg-amber-50 text-amber-700"
                  : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Admin Panel" : undefined}
            >
              <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${pathname === "/admin" ? "text-amber-600" : ""}`} />
              {!collapsed && (
                <>
                  <span>Admin Panel</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                    SYS
                  </span>
                </>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
