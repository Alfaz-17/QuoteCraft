"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  ExternalLink, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronRight,
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminTopBar() {
  const pathname = usePathname();
  const { user } = useUser();

  if (pathname === "/admin/login") return null;

  // Derive friendly section name
  const getSectionName = () => {
    if (pathname === "/admin") return "Executive Command Center";
    if (pathname.includes("/customers")) return "Suppliers & Tenants";
    if (pathname.includes("/ai-usage")) return "AI Telemetry & Token Costs";
    if (pathname.includes("/settings")) return "Platform & Quota Controls";
    if (pathname.includes("/activity-logs")) return "Security & Audit Trail";
    if (pathname.includes("/quotations")) return "Quotation Repository";
    if (pathname.includes("/revenue")) return "Revenue & Subscriptions";
    if (pathname.includes("/analytics")) return "Performance Analytics";
    if (pathname.includes("/support")) return "Customer Inquiries";
    return "Administration";
  };

  const displayName = user?.fullName || user?.firstName || "Founder";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 select-none">
      {/* Left: Breadcrumbs & Live Pulse */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Link href="/admin" className="hover:text-slate-900 transition-colors">
            Admin
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate">
            {getSectionName()}
          </span>
        </div>

        {/* Live Status Chip */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden md:inline font-mono">Live Engine</span>
          <span className="text-slate-400 hidden md:inline">•</span>
          <span className="font-mono text-emerald-700 font-bold">Groq Active</span>
        </div>
      </div>

      {/* Right: Quick actions & Founder Identity */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href="/admin/settings"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-colors"
          title="Adjust AI Quotas and Platform Controls"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Quota Controls</span>
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] border border-[#0F766E]/30 transition-colors"
          title="Open Supplier Workspace"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Supplier App</span>
          <span className="sm:hidden">App</span>
        </Link>

        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-extrabold text-slate-900 leading-none">{displayName}</p>
            <p className="text-[10px] text-amber-600 font-black tracking-wider uppercase mt-0.5">Super Admin</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-black text-xs shadow-2xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}

