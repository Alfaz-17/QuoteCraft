"use client";

import React from "react";
import { Check, UploadCloud, CheckSquare, DollarSign, Send } from "lucide-react";

export type FlowStep = 1 | 2 | 3 | 4;

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
      shortLabel: "Upload",
      icon: UploadCloud,
      available: true,
    },
    {
      num: 2 as FlowStep,
      label: "2. Check items",
      shortLabel: "Items",
      icon: CheckSquare,
      badge: hasItems ? `${itemCount}` : undefined,
      available: hasItems || currentStep >= 2,
    },
    {
      num: 3 as FlowStep,
      label: "3. Add prices",
      shortLabel: "Prices",
      icon: DollarSign,
      available: hasItems || currentStep >= 3,
    },
    {
      num: 4 as FlowStep,
      label: "4. Send quote",
      shortLabel: "Send",
      icon: Send,
      available: hasItems || currentStep >= 4,
    },
  ];

  return (
    <div className="w-full bg-white/70 backdrop-blur-md border-b border-slate-200/70 sticky top-12 z-30 px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-4xl mx-auto">
        {/* Native Segmented Pill Bar */}
        <nav className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-inner">
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            const isClickable = step.available;

            return (
              <button
                key={step.num}
                type="button"
                disabled={!isClickable}
                onClick={() => onStepChange(step.num)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-semibold transition-all duration-200 select-none min-h-[40px] ${
                  isActive
                    ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-bold ring-1 ring-slate-900/5"
                    : isCompleted
                    ? "text-slate-700 hover:text-slate-900 hover:bg-white/50 cursor-pointer"
                    : isClickable
                    ? "text-slate-500 hover:text-slate-800 hover:bg-white/50 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed opacity-60"
                }`}
                title={step.label}
              >
                {/* Step Icon or Checkmark badge */}
                <span
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                </span>

                {/* Desktop label */}
                <span className="hidden sm:inline whitespace-nowrap text-xs">
                  {step.label.replace(/^\d+\.\s*/, "")}
                </span>

                {/* Mobile label */}
                <span className="sm:hidden whitespace-nowrap text-[11px]">
                  {step.shortLabel}
                </span>

                {/* Item counter badge */}
                {step.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-200/80 text-slate-600"
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
