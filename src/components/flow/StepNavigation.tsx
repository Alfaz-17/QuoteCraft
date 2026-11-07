"use client";

import React from "react";
import { Check, UploadCloud, CheckSquare, DollarSign } from "lucide-react";

export type FlowStep = 1 | 2 | 3;

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
      label: "1. Upload RFQ",
      mobileLabel: "1. Upload",
      icon: UploadCloud,
      available: true,
    },
    {
      num: 2 as FlowStep,
      label: "2. Review Items",
      mobileLabel: "2. Review",
      icon: CheckSquare,
      badge: hasItems ? `${itemCount}` : undefined,
      available: hasItems || currentStep >= 2,
    },
    {
      num: 3 as FlowStep,
      label: "3. Pricing & Preview",
      mobileLabel: "3. Pricing",
      icon: DollarSign,
      available: hasItems || currentStep >= 3,
    },
  ];

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 relative shrink-0 z-20 px-3 sm:px-6 py-1.5">
      <div className="max-w-4xl mx-auto">
        {/* Segmented Pill Bar */}
        <nav className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 shadow-inner">
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => step.available && onStepChange(step.num)}
                disabled={!step.available}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[42px] select-none ${
                  isActive
                    ? "bg-white text-brand-600 shadow-xs"
                    : isCompleted
                    ? "text-slate-700 hover:text-slate-900 hover:bg-white/50 cursor-pointer"
                    : "text-slate-400 cursor-not-allowed opacity-60"
                }`}
              >
                {/* Check icon or Step Number */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                </span>

                <span className="hidden sm:inline font-bold truncate">{step.label}</span>
                <span className="inline sm:hidden font-bold truncate">{step.mobileLabel}</span>

                {step.badge && (
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-teal-50 text-brand-600 border border-teal-200" : "bg-slate-200 text-slate-700"
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
