import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "QuoteCraft Owner Command Center | Administration",
  description: "Private SaaS Founder & Owner Command Center for QuoteCraft.",
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row antialiased">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {children}
      </div>
    </div>
  );
}
