"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import Link from "next/link";
import { Ship, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  isPopular?: boolean;
}

const TEMPLATES: TemplateInfo[] = [
  {
    id: "marine",
    name: "Marine Professional",
    description: "Designed specifically for ship supplies, engine spares & technical maritime RFQs.",
    isPopular: true,
  },
  {
    id: "minimal",
    name: "Minimal Business",
    description: "Clean, high-density typographic layout suitable for commercial industrial parts.",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Modern maritime aesthetic with deep navy and cyan accents.",
  },
  {
    id: "modern",
    name: "Modern Clean",
    description: "Contemporary SaaS invoice aesthetic with sleek borders and badge styling.",
  },
];

export default function TemplatesPage() {
  const [selectedId, setSelectedId] = useState("marine");
  const { success: toastSuccess } = useToast();

  const handleSelectTemplate = (id: string, name: string) => {
    setSelectedId(id);
    toastSuccess(`Template set to "${name}"!`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen text-slate-900 pb-24 md:pb-12">
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quotation Templates
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Choose from our professional templates or create your own.
          </p>
        </div>

        {/* Templates Grid with Right Callout Card (Mockup Screen 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 4 Templates Preview Cards (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEMPLATES.map((tpl) => {
              const isSelected = selectedId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                  className={`bg-white rounded-3xl border-2 p-5 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 shadow-md ring-4 ring-blue-500/10"
                      : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  {/* Selected Check Badge */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {/* Template Visual Thumbnail Skeleton */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-4 space-y-2 h-44 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="w-16 h-3 bg-blue-900/30 rounded" />
                      <div className="w-12 h-2.5 bg-slate-300 rounded" />
                    </div>

                    <div className="space-y-1.5 py-1">
                      <div className="w-full h-2 bg-slate-200 rounded" />
                      <div className="w-5/6 h-2 bg-slate-200 rounded" />
                      <div className="w-4/6 h-2 bg-slate-200 rounded" />
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <div className="w-20 h-3 bg-blue-600/40 rounded" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{tpl.name}</h4>
                      {tpl.isPopular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          Recommended
                        </span>
                      )}
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
          <div className="lg:col-span-4 bg-gradient-to-br from-[#071329] to-[#0F2854] text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-blue-950 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Ship className="w-6 h-6 stroke-[2]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Professional templates for your marine business
                </h3>
                <p className="text-xs text-blue-200 font-medium mt-2 leading-relaxed">
                  Every template is engineered to prevent single-letter text wrapping, handle multi-page technical quotations, and display clear commercial terms.
                </p>
              </div>
            </div>

            <Button
              asChild
              className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
            >
              <Link href="/">
                Use Template <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
