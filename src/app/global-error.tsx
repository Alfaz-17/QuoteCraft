"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center font-sans antialiased text-slate-800">
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-xl max-w-lg w-full p-8 space-y-6">
          <div className="w-14 h-14 rounded-md bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Application Error
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {error?.message || "An application error occurred. Please refresh or configure environment variables."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold shadow-md shadow-[#0F766E]/20 transition-all hover:scale-[1.02]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reload Application
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

