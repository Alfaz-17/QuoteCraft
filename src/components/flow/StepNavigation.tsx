"use client";

import React from "react";
import { Check, UploadCloud, CheckSquare, DollarSign, SlidersHorizontal, Eye } from "lucide-react";

export type FlowStep = 1 | 2 | 3 | 4 | 5;

interface StepNavigationProps {
  currentStep: FlowStep;
  onStepChange: (step: FlowStep) => void;
  itemCount: number;
  hasItems: boolean;
}

export function StepNavigation({
  currentStep,
  onStepChange,
  itemCount,
  hasItems,
}: StepNavigationProps) {
  const steps = [
    {
      num: 1 as FlowStep,
      label: "1. Upload Request",
      shortLabel: "Upload",
      icon: UploadCloud,
      available: true,
    },
    {
      num: 2 as FlowStep,
      label: "2. Review Items",
      shortLabel: "Review",
      icon: CheckSquare,
      badge: hasItems ? `${itemCount}` : undefined,
      available: hasItems || currentStep >= 2,
    },
    {
      num: 3 as FlowStep,
      label: "3. Add Prices",
      shortLabel: "Pricing",
      icon: DollarSign,
      available: hasItems || currentStep >= 3,
    },
    {
      num: 4 as FlowStep,
      label: "4. Customize Columns",
      shortLabel: "Columns",
      icon: SlidersHorizontal,
      available: hasItems || currentStep >= 4,
    },
    {
      num: 5 as FlowStep,
      label: "5. Preview & Finalize",
      shortLabel: "Preview",
      icon: Eye,
      available: hasItems || currentStep >= 5,
    },
  ];

  return (
    <div className="w-full bg-white/70 backdrop-blur-md border-b border-slate-200/70 sticky top-12 z-30 px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-5xl mx-auto">
        {/* Native Segmented Pill Bar */}
        <nav className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-inner">
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => step.available && onStepChange(step.num)}
                disabled={!step.available}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[40px] select-none ${
                  isActive
                    ? "bg-white text-primary shadow-xs scale-[1.01]"
                    : isCompleted
                    ? "text-slate-700 hover:text-slate-900 hover:bg-white/40 cursor-pointer"
                    : "text-slate-400 cursor-not-allowed opacity-50"
                }`}
              >
                {/* Completed Check icon OR Step Number */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isActive
                      ? "bg-primary text-white"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                </span>

                <span className="hidden md:inline truncate">{step.label}</span>
                <span className="inline md:hidden truncate">{step.shortLabel}</span>

                {step.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold hidden sm:inline ${
                      isActive ? "bg-primary/10 text-primary" : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {step.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
