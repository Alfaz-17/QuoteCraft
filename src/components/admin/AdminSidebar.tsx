"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  LineChart,
  Cpu,
  FileSpreadsheet,
  LifeBuoy,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";

export const adminNavGroups = [
  {
    label: "Main",
    items: [
      { name: "Overview", href: "/admin", icon: LayoutDashboard },
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Quotations", href: "/admin/quotations", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Analytics", href: "/admin/analytics", icon: LineChart },
      { name: "AI usage", href: "/admin/ai-usage", icon: Cpu },
    ],
  },
  {
    label: "Manage",
    items: [
      { name: "Support tickets", href: "/admin/support", icon: LifeBuoy },
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Audit log", href: "/admin/activity-logs", icon: ScrollText },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((g) => g.items);

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <QuoteCraftLogo size={28} showText={false} />
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-900">QuoteCraft</p>
        <p className="text-[11px] text-slate-500">Admin</p>
      </div>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") return null;

  const displayName = user?.fullName || user?.firstName || "Admin";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  const nav = (onItemClick?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      {adminNavGroups.map((group) => (
        <div key={group.label} className="space-y-0.5">
          <p className="px-3 pb-1 text-[11px] font-medium text-slate-400">{group.label}</p>
          {group.items.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#0F766E]" : "text-slate-400")} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      ))}

      <div className="pt-4 border-t border-slate-100">
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <ExternalLink className="w-4 h-4 text-slate-400" />
          Open QuoteCraft app
        </Link>
      </div>
    </nav>
  );

  const account = (
    <div className="p-3 border-t border-slate-200">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/admin/login" })}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30">
        <div className="h-14 px-5 flex items-center border-b border-slate-200">
          <Brand />
        </div>
        {nav()}
        {account}
      </aside>

      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <Brand />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85%] bg-white h-full flex flex-col shadow-xl">
            <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {nav(() => setMobileOpen(false))}
            {account}
          </div>
        </div>
      )}
    </>
  );
}
