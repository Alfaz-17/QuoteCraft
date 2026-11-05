"use client";

import React, { useId } from "react";

interface LoaderProps {
  className?: string;
  variant?: "light" | "dark";
  showText?: boolean;
}

/**
 * 1. QuoteCraft Origami Draw Loader
 * Features dynamic stroke drawing & fill reveals for maritime origami sails.
 */
export function OrigamiDrawLoader({
  className = "",
  variant = "light",
  showText = true,
}: LoaderProps) {
  const isDark = variant === "dark";

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
        width="160"
        height="140"
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <style>{`
          @keyframes qcStrokeDraw {
            0% { stroke-dashoffset: 600; fill-opacity: 0; }
            65% { stroke-dashoffset: 0; fill-opacity: 0.2; }
            85%, 100% { stroke-dashoffset: 0; fill-opacity: 1; }
          }
          .qc-draw-path {
            stroke-dasharray: 600;
            animation: qcStrokeDraw 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
        {/* Main Sail (Teal) */}
        <path
          className="qc-draw-path"
          d="M98 18 L34 104 L98 116 Z"
          fill="#0F766E"
          stroke="#14B8A6"
          strokeWidth={2}
        />
        {/* Aft Sail (Deep Navy-Teal) */}
        <path
          className="qc-draw-path"
          style={{ animationDelay: "0.2s" }}
          d="M106 28 C140 58 166 94 158 122 L106 117 Z"
          fill="#0D5A54"
          stroke="#0F766E"
          strokeWidth={2}
        />
        {/* Hull / Wave (Gold / Amber) */}
        <path
          className="qc-draw-path"
          style={{ animationDelay: "0.4s" }}
          d="M14 120 C54 108 118 122 182 112 C154 146 76 154 14 120 Z"
          fill="#F59E0B"
          stroke="#FBBF24"
          strokeWidth={2}
        />
      </svg>
      {showText && (
        <div
          className={`mt-4 font-bold tracking-tight text-base select-none ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Quote<span className="text-[#F59E0B]">Craft</span>
        </div>
      )}
    </div>
  );
}

/**
 * 2. QuoteCraft Hero Sailing Loader
 * Features a bobbing container vessel on gentle oceanic swell with branded slogan.
 */
export function HeroSailingLoader({
  className = "",
  variant = "light",
  showTagline = true,
  statusMessage,
}: LoaderProps & { showTagline?: boolean; statusMessage?: string }) {
  const isDark = variant === "dark";
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const sailGradId = `sailGrad_${id}`;
  const hullGradId = `hullGrad_${id}`;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <style>{`
        @keyframes qcBoatBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(-1.5deg); }
        }
        @keyframes qcWaveRoll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .qc-anim-boat {
          animation: qcBoatBob 2.6s ease-in-out infinite;
        }
        .qc-anim-wave {
          animation: qcWaveRoll 3.5s linear infinite;
        }
      `}</style>

      <div className="qc-anim-boat">
        <svg
          width="130"
          height="110"
          viewBox="0 0 160 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={sailGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
            <linearGradient id={hullGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Fore Sail */}
          <path d="M80 14 L30 88 L80 100 Z" fill={`url(#${sailGradId})`} />
          {/* Main Sail */}
          <path
            d="M86 22 C115 48 135 78 128 102 C115 102 96 100 86 100 Z"
            fill="#0B4B46"
          />
          {/* Wave-cut Hull */}
          <path
            d="M12 104 C48 94 98 106 148 98 C125 125 65 132 12 104 Z"
            fill={`url(#${hullGradId})`}
          />
        </svg>
      </div>

      <div className="text-center mt-3 select-none">
        <div
          className={`text-xl font-black tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Quote<span className="text-[#F59E0B]">Craft</span>
        </div>
        {statusMessage ? (
          <p className="text-xs font-semibold text-brand-700 mt-1 animate-pulse">
            {statusMessage}
          </p>
        ) : showTagline ? (
          <p
            className={`text-xs mt-0.5 font-medium ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            From Enquiry to Quotation, <span className="text-[#F59E0B] font-bold">Faster.</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 3. QuoteCraft Dual Orbital Blade Spinner
 * High-performance lightweight spinner with counter-rotating teal & gold blades.
 */
export function DualOrbitalSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const borderMap = {
    sm: "border",
    md: "border-2",
    lg: "border-2",
    xl: "border-[3px]",
  };

  const dim = sizeMap[size] || sizeMap.md;
  const b = borderMap[size] || borderMap.md;

  return (
    <div className={`relative inline-block ${dim} shrink-0 ${className}`}>
      {/* Outer subtle track */}
      <div className={`absolute inset-0 rounded-full ${b} border-teal-500/20`} />
      {/* Forward rotating Teal blade */}
      <div
        className={`absolute inset-0 rounded-full ${b} border-transparent border-t-teal-500 border-r-teal-600 animate-spin`}
      />
      {/* Counter-rotating Amber blade */}
      <div
        className={`absolute inset-0.5 rounded-full ${b} border-transparent border-b-amber-400 border-l-amber-500 animate-[spin_1.8s_linear_infinite_reverse]`}
      />
    </div>
  );
}

