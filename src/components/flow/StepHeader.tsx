"use client";

import React from "react";

interface StepHeaderProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  badge?: string;
}

export function StepHeader({ step, title, subtitle, badge }: StepHeaderProps) {
  return (
    <div className="space-y-1.5 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          Step {step} of 3
        </span>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#0F766E] border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {/* 3-Segment Progress Indicator */}
      <div className="flex gap-1.5 w-full py-1">
        <div
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            step >= 1 ? "bg-[#0F766E]" : "bg-[#E2E8F0]"
          }`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            step >= 2 ? "bg-[#0F766E]" : "bg-[#E2E8F0]"
          }`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            step >= 3 ? "bg-[#0F766E]" : "bg-[#E2E8F0]"
          }`}
        />
      </div>

      <div className="pt-1">
        <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

