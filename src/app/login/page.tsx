"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Ship, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="min-h-screen bg-[#071329] text-white flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Subtle ocean grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 pt-4 flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Ship className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
            QuoteCraft
          </h1>
          <p className="text-xs text-blue-300 font-semibold tracking-wider uppercase mt-1">
            Marine Quotation Assistant
          </p>
        </div>
      </div>

      {/* Center Vessel Visual */}
      <div className="relative z-10 my-auto py-6 flex flex-col items-center text-center max-w-sm mx-auto space-y-6">
        <div className="relative w-full max-w-[280px] sm:max-w-xs aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-b from-blue-900/40 via-blue-950/60 to-[#071329] border border-blue-500/20 shadow-2xl flex items-center justify-center p-4">
          <div className="space-y-3 text-center">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center border border-blue-400/30 shadow-inner">
              <Ship className="w-14 h-14 stroke-[1.5]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
                Marine & Ship Supplies
              </span>
              <p className="text-xs text-blue-200 font-mono">Fast • Accurate • Branded</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Turn RFQs into Professional Quotations
          </h2>
          <p className="text-xs sm:text-sm text-blue-200/80 font-medium max-w-xs mx-auto">
            Extract items from buyer spreadsheets and PDFs in seconds. Built for marine suppliers and ship chandlers.
          </p>
        </div>
      </div>

      {/* Bottom Actions (Screen 1 in Mobile Mockup) */}
      <div className="relative z-10 w-full max-w-sm mx-auto space-y-3 pb-4">
        <Button
          asChild
          className="w-full h-12 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 min-h-[48px]"
        >
          <Link href="/sign-in">
            Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-full h-12 rounded-2xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-900 border-none shadow-md min-h-[48px]"
        >
          <Link href="/sign-up">Create Account</Link>
        </Button>

        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-300/70">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Trusted by Marine Suppliers</span>
        </div>
      </div>
    </main>
  );
}
