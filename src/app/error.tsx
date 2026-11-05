"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("QuoteCraft Client-Side Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-center">
          <QuoteCraftLogo size={42} showTagline={false} />
        </div>

        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 stroke-[2]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Something unexpected occurred
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {error?.message || "A client-side exception occurred while rendering this page."}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-slate-400">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold shadow-md shadow-[#0F766E]/20 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

