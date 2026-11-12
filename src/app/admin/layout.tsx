import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | QuoteCraft",
  description: "QuoteCraft administration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row antialiased">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminTopBar />
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
