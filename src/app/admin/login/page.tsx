"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useClerk, SignIn } from "@clerk/nextjs";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { ShieldCheck, Lock, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const [isVerifyingOwner, setIsVerifyingOwner] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    searchParams.get("error") === "unauthorized"
      ? "Access Denied: Your account is not authorized as a QuoteCraft Super Admin."
      : ""
  );

  // If already logged in, verify if user has SUPER_ADMIN role
  useEffect(() => {
    async function checkRole() {
      if (isLoaded && isSignedIn && user) {
        setIsVerifyingOwner(true);
        try {
          const res = await fetch("/api/admin/overview");
          if (res.ok) {
            router.replace("/admin");
          } else {
            setErrorMsg("This account is not authorized for Owner Administration. Please sign in with founder credentials.");
            setIsVerifyingOwner(false);
          }
        } catch {
          setIsVerifyingOwner(false);
        }
      }
    }
    checkRole();
  }, [isLoaded, isSignedIn, user, router]);

  return (
    <div className="min-h-screen bg-[#031820] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0F766E]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Customer App */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to QuoteCraft
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#05242E] border border-[#0D3845] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <QuoteCraftLogo size={46} variant="dark" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#F59E0B] text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Founder / Owner Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Owner Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Private management and operational monitoring for QuoteCraft.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Security Notice</p>
              <p className="text-[11px] text-rose-300 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {isVerifyingOwner ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-teal-300">Verifying Super Admin Authorization...</p>
          </div>
        ) : isSignedIn ? (
          <div className="p-4 rounded-2xl bg-[#031820] border border-[#0D3845] space-y-3 text-center">
            <p className="text-xs text-slate-300">
              Currently signed in as:
            </p>
            <p className="text-xs font-mono font-bold text-teal-300 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={() => router.replace("/admin")}
                className="w-full h-11 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white font-bold text-xs"
              >
                Enter Command Center <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="w-full h-10 rounded-xl border-[#0D3845] text-slate-300 hover:text-white hover:bg-slate-800/50 text-xs"
              >
                Sign In with Different Account
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-2 overflow-hidden shadow-lg border border-slate-200">
            <SignIn
              routing="hash"
              fallbackRedirectUrl="/admin"
              signUpUrl="/admin/login"
            />
          </div>
        )}

        {/* Security Disclaimers */}
        <div className="pt-4 border-t border-[#0D3845]/70 space-y-1.5 text-center text-[11px] text-slate-500">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            End-to-end encrypted • Server-side role enforced
          </p>
          <p>Normal customer registrations cannot access this system.</p>
        </div>
      </div>
    </div>
  );
}
