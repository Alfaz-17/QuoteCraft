"use client";

export const dynamic = "force-dynamic";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Check, ArrowLeft, ArrowRight, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { useQuotationState } from "@/hooks/useQuotationState";
import { QUOTATION_TEMPLATES, TemplateLayoutId } from "@/types/quotation.types";
import { HeroSailingLoader } from "@/components/ui/Loaders";

export default function TemplatesPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { state, dispatch } = useQuotationState();
  const { success: toastSuccess } = useToast();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <HeroSailingLoader statusMessage="Verifying authorization..." />
      </div>
    );
  }

  const selectedId = state.branding.layout || "marine";

  const handleSelectTemplate = (id: TemplateLayoutId, name: string) => {
    const updatedBranding = {
      ...state.branding,
      layout: id,
    };

    dispatch({
      type: "SET_BRANDING",
      payload: updatedBranding,
    });

    try {
      localStorage.setItem("brandingProfile", JSON.stringify(updatedBranding));
    } catch (e) {
      console.error(e);
    }

    toastSuccess(`Template set to "${name}"!`);
  };

  const handleUseTemplate = () => {
    toastSuccess("Template active! Loading quotation builder...");
    router.push("/");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F5] min-h-screen text-[#0F172A] pb-28 md:pb-12">
      {/* ===== SCREEN 8: NATIVE APP HEADER ===== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3 sticky top-0 z-20 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors -ml-1 min-h-[44px] min-w-[44px]"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight leading-none">
              Templates
            </h1>
          </div>

          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline min-h-[44px]"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Branding in Settings</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 space-y-5 animate-in fade-in duration-300">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Quotation Templates
          </h2>
          <p className="text-[13px] text-[#475569] font-medium">
            Choose your organization&apos;s default layout for all generated PDF quotations.
          </p>
        </div>

        {/* 2x2 Visual Templates Grid (Screen 8 in Mockup) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {QUOTATION_TEMPLATES.map((tpl) => {
            const isSelected = selectedId === tpl.id;

            return (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                className={`bg-white rounded-2xl border-2 p-3 sm:p-4 transition-all cursor-pointer relative flex flex-col justify-between hover:shadow-sm active:scale-[0.98] ${
                  isSelected
                    ? "border-[#0F766E] shadow-sm ring-4 ring-[#0F766E]/10"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Selected Check Badge */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Template Visual Thumbnail Skeleton */}
                <div className="bg-[#FAF9F5] rounded-xl border border-slate-200/80 p-3 mb-3 space-y-2 h-32 sm:h-44 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div 
                      className="w-12 sm:w-16 h-2.5 sm:h-3 rounded"
                      style={{ backgroundColor: state.branding.primaryColor || "#0F766E" }}
                    />
                    <div className="w-8 sm:w-12 h-2 sm:h-2.5 bg-slate-300 rounded" />
                  </div>

                  <div className="space-y-1.5 py-1">
                    <div className="w-full h-1.5 sm:h-2 bg-slate-200 rounded" />
                    <div className="w-5/6 h-1.5 sm:h-2 bg-slate-200 rounded" />
                    <div className="w-4/6 h-1.5 sm:h-2 bg-slate-200 rounded" />
                  </div>

                  <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase truncate">
                      {tpl.name}
                    </span>
                    <div 
                      className="w-10 sm:w-14 h-2 sm:h-2.5 rounded opacity-80"
                      style={{ backgroundColor: state.branding.secondaryColor || "#F59E0B" }}
                    />
                  </div>
                </div>

                {/* Template Name & Source */}
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#0F172A] truncate">
                    {tpl.name}
                  </h4>
                  <p className="text-[11px] text-[#475569] truncate">
                    {tpl.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Primary CTA Button: Use Template (Screen 8 in Mockup) */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleUseTemplate}
            className="w-full h-12 rounded-xl text-sm font-bold bg-[#0F766E] hover:bg-[#0D6B63] active:scale-[0.98] text-white shadow-md shadow-[#0F766E]/20 transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span>Use Template</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
