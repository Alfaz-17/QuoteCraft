import React, { Suspense } from "react";
import { AdminLoginClient } from "./AdminLoginClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Owner Command Center Login | QuoteCraft",
  description: "Sign in to QuoteCraft Owner Command Center.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#031820] flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md bg-[#05242E] border border-[#0D3845] rounded-3xl p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-400">Loading Owner Command Center...</p>
          </div>
        </div>
      }
    >
      <AdminLoginClient />
    </Suspense>
  );
}
