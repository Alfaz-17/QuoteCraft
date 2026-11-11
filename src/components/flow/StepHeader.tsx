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
    <div className="space-y-2 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Step {step} of 3
        </span>
        {badge && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
            {badge}
          </span>
        )}
      </div>

      {/* 3-Segment Progress Indicator */}
      <div className="flex gap-1.5 w-full py-1">
        <div
          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
            step >= 1 ? "bg-[#0F766E]" : "bg-[#E2E8F0]"
          }`}
        />
        <div
          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
            step >= 2 ? "bg-[#0F766E]" : "bg-[#E2E8F0]"
          }`}
        />
        <div
          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
            step >= 3 ? "bg-[#0F766E]" : "bg-[#E2E8F0]"
          }`}
        />
      </div>

      <div className="pt-1">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

