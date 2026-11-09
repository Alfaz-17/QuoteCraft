"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  LineChart,
  CreditCard,
  Cpu,
  FileSpreadsheet,
  LifeBuoy,
  Sliders,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";

export const adminNavItems = [
  {
    name: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
    badge: null,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: LineChart,
    badge: null,
  },
  {
    name: "Revenue & Plans",
    href: "/admin/revenue",
    icon: CreditCard,
    badge: "SaaS",
  },
  {
    name: "AI Usage & Costs",
    href: "/admin/ai-usage",
    icon: Cpu,
    badge: "Groq",
  },
  {
    name: "Quotations",
    href: "/admin/quotations",
    icon: FileSpreadsheet,
    badge: null,
  },
  {
    name: "Support & Feedback",
    href: "/admin/support",
    icon: LifeBuoy,
    badge: null,
  },
  {
    name: "Platform Settings",
    href: "/admin/settings",
    icon: Sliders,
    badge: null,
  },
  {
    name: "Security & Audit Logs",
    href: "/admin/activity-logs",
    icon: ShieldAlert,
    badge: null,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on login page, don't show admin sidebar
  if (pathname === "/admin/login") return null;

  const displayName = user?.fullName || user?.firstName || "Founder / Owner";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "alfazbilakhiya17@gmail.com";
  const userInitial = displayName.charAt(0).toUpperCase() || "A";

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-400/80">
        Owner Command Center
      </div>
      {adminNavItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[42px]",
              isActive
                ? "bg-[#0F766E] text-white shadow-md shadow-[#0F766E]/40 font-bold"
                : "text-slate-300 hover:text-white hover:bg-[#082E3A]"
            )}
          >
            <item.icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-[#F59E0B]" : "text-slate-400 group-hover:text-white"
              )}
            />
            <span className="flex-1 truncate">{item.name}</span>
            {item.badge && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-extrabold",
                  isActive
                    ? "bg-[#F59E0B] text-slate-900"
                    : "bg-teal-900/60 text-teal-300 border border-teal-700/50"
                )}
              >
                {item.badge}
              </span>
            )}
            {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-200 shrink-0" />}
          </Link>
        );
      })}

      <div className="pt-4 mt-2 border-t border-[#0D3845]/70 space-y-1">
        <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Customer Application
        </div>
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className="group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#082E3A] transition-all"
        >
          <span className="flex items-center gap-2.5">
            <QuoteCraftLogo size={18} variant="dark" />
            <span>Go to App</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#031820] text-slate-200 h-screen sticky top-0 shrink-0 z-30 select-none border-r border-[#0D3845]">
        {/* Header Branding */}
        <div className="p-4 border-b border-[#0D3845]/70 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <QuoteCraftLogo size={32} variant="dark" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white tracking-tight">QuoteCraft</span>
                <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-[#F59E0B] border border-amber-500/30">
                  Founder
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide">
                Owner Command Center
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        {renderNavLinks()}

        {/* Founder Profile & Logout */}
        <div className="p-3 border-t border-[#0D3845]/70 bg-[#021319]">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#06232E] border border-[#0D3845]/60 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-teal-300 font-mono truncate">{userEmail}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ring-4 ring-emerald-400/20" title="Founder Active" />
          </div>

          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/admin/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR & SLIDE DRAWER ── */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#031820] border-b border-[#0D3845] px-4 py-3 flex items-center justify-between text-white">
        <Link href="/admin" className="flex items-center gap-2">
          <QuoteCraftLogo size={26} variant="dark" />
          <div>
            <span className="font-extrabold text-sm text-white">QuoteCraft</span>
            <span className="ml-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-[#F59E0B]">
              Owner
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-[#082E3A] text-slate-200 hover:text-white border border-[#0D3845]"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[#031820] text-slate-200 animate-in fade-in duration-200">
          <div className="p-4 border-b border-[#0D3845] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QuoteCraftLogo size={28} variant="dark" />
              <div>
                <p className="font-black text-sm text-white">Owner Command Center</p>
                <p className="text-[10px] text-teal-400 font-mono">{userEmail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl bg-[#082E3A] text-slate-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {renderNavLinks(() => setMobileOpen(false))}
          </div>

          <div className="p-4 border-t border-[#0D3845] bg-[#021319]">
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/admin/login" })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/40 border border-rose-900/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

