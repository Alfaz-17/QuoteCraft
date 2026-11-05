"use client";

export const dynamic = "force-dynamic";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Ship, Check, ArrowRight, Palette, Sliders } from "lucide-react";
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

    toastSuccess(`Default template set to "${name}"!`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F5] min-h-screen text-slate-900 pb-24 md:pb-12 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Templates
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">Quotation Styles</span>
          </div>

          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <Palette className="w-3.5 h-3.5" />
            Color Palettes & Fonts in Settings
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quotation Templates
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Select your organization&apos;s default quotation layout. Colors and fonts are configured in Settings.
          </p>
        </div>

        {/* Templates Grid with Right Callout Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 4 Templates Preview Cards (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUOTATION_TEMPLATES.map((tpl) => {
              const isSelected = selectedId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                  className={`bg-white rounded-lg border-2 p-5 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? "border-[#0F766E] shadow-md ring-4 ring-[#0F766E]/10"
                      : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  {/* Selected Check Badge */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {/* Template Visual Thumbnail Skeleton */}
                  <div className="bg-[#FAF9F5] rounded-md border border-slate-200/80 p-4 mb-4 space-y-2 h-44 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div 
                        className="w-16 h-3 rounded"
                        style={{ backgroundColor: state.branding.primaryColor || "#0F766E" }}
                      />
                      <div className="w-12 h-2.5 bg-slate-300 rounded" />
                    </div>

                    <div className="space-y-1.5 py-1">
                      <div className="w-full h-2 bg-slate-200 rounded" />
                      <div className="w-5/6 h-2 bg-slate-200 rounded" />
                      <div className="w-4/6 h-2 bg-slate-200 rounded" />
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                        {tpl.tagline}
                      </span>
                      <div 
                        className="w-16 h-3 rounded opacity-80"
                        style={{ backgroundColor: state.branding.secondaryColor || "#F59E0B" }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{tpl.name}</h4>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E0F2F1] text-[#0F766E]">
                        {tpl.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Callout Banner Card (4 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#041E26] via-[#0A333C] to-[#0D4D47] text-white rounded-lg p-6 sm:p-8 space-y-6 shadow-xl border border-[#0D3845] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-md bg-[#0F766E] text-[#F59E0B] flex items-center justify-center shadow-md">
                <Ship className="w-6 h-6 stroke-[2]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Maritime & Industrial Document Layouts
                </h3>
                <p className="text-xs text-teal-100/90 font-medium mt-2 leading-relaxed">
                  Your chosen template automatically formats all generated PDF quotations. You can customize colors, fonts, company details, and bank credentials in Settings.
                </p>
              </div>

              <div className="pt-2 border-t border-teal-800/60 space-y-2">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#F59E0B] hover:underline"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Customize Color Palette & Fonts →
                </Link>
              </div>
            </div>

            <Button
              asChild
              className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-lg shadow-[#0F766E]/30"
            >
              <Link href="/">
                Create Quotation <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
