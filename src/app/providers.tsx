"use client";

import React from "react";
import { QuotationProvider } from "@/hooks/useQuotationState";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    (process.env.NODE_ENV !== "production"
      ? "pk_test_dmlhYmxlLXRlcnJpZXItNjMuY2xlcmsuYWNjb3VudHMuZGV2JA"
      : "pk_live_Y2xlcmsucXVvdGUtY3JhZnQtcmVkLnZlcmNlbC5hcHAk");

  // If publishable key is missing in production, display an informative banner instead of crashing with 500
  if (!publishableKey) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <span className="text-xl">⚓</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Clerk Production Key Required</h2>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            The application is in production mode, but <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-[#0F766E] font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is not configured in Vercel environment variables.
          </p>
          <div className="text-left bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600 space-y-1 font-mono">
            <div>1. Go to Vercel &rarr; Settings &rarr; Environment Variables</div>
            <div>2. Add <span className="text-[#0F766E] font-semibold">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span></div>
            <div>3. Add <span className="text-[#0F766E] font-semibold">CLERK_SECRET_KEY</span></div>
            <div>4. Trigger a Redeploy in Vercel</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: "#0F766E",
          colorBackground: "#ffffff",
        },
      }}
    >
      <ToastProvider>
        <QuotationProvider>{children}</QuotationProvider>
      </ToastProvider>
    </ClerkProvider>
  );
}
