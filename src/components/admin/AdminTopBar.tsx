"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { adminNavItems } from "@/components/admin/AdminSidebar";

export function AdminTopBar() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  const current =
    adminNavItems.find((i) => (i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)))?.name ||
    "Admin";

  return (
    <header className="hidden lg:flex sticky top-0 z-20 h-14 bg-white border-b border-slate-200 px-8 items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500 hover:text-slate-900">
          Admin
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-900">{current}</span>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-700 border border-slate-200 hover:bg-slate-50"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Open app
      </Link>
    </header>
  );
}
