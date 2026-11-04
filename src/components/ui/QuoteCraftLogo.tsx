"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
  variant?: "light" | "dark";
}

export function QuoteCraftLogo({
  className = "",
  size = 38,
  showText = true,
  showTagline = false,
  variant = "light",
}: LogoProps) {
  const isDark = variant === "dark";

  // If icon-only is requested
  if (!showText) {
    return (
      <div className={`inline-flex items-center shrink-0 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt="QuoteCraft Mark"
          style={{ height: size, width: size }}
          className="object-contain transition-transform duration-200 group-hover:scale-105 shrink-0"
        />
      </div>
    );
  }

  // If dark variant (e.g. dark sidebar), use logo mark with white/gold text
  if (isDark) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt="QuoteCraft Mark"
          style={{ height: size, width: size }}
          className="object-contain transition-transform duration-200 group-hover:scale-105 shrink-0"
        />
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight font-extrabold text-lg sm:text-xl">
            <span className="text-white">Quote</span>
            <span className="text-[#F59E0B] font-black">Craft</span>
          </div>
          {showTagline && (
            <span className="text-[10px] tracking-wider font-semibold uppercase mt-0.5 text-slate-400">
              Quote • Manage • Grow
            </span>
          )}
        </div>
      </div>
    );
  }

  // Standard light variant: Render the official high-resolution logo asset
  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="QuoteCraft: From Enquiry to Quotation, Faster"
        style={{ height: size }}
        className="w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.02] shrink-0"
      />
    </div>
  );
}

/**
 * App Icon as seen in the bottom left of the design sheet:
 * - Teal Variant: Dark teal square with white sails and gold wave
 * - White Variant: White square with teal sails and gold wave
 */
export function QuoteCraftAppIcon({
  variant = "teal",
  size = 56,
  className = "",
}: {
  variant?: "teal" | "white";
  size?: number;
  className?: string;
}) {
  const isTeal = variant === "teal";

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl flex items-center justify-center p-2.5 transition-all shadow-md ${
        isTeal
          ? "bg-[#0F766E] border border-[#0B4B46] shadow-[#0F766E]/20"
          : "bg-white border border-slate-200/90 shadow-slate-200"
      } ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Sails */}
        <path
          d="M46 14 C 46 14 48 38 64 56 C 66 58 48 62 36 62 C 40 44 46 14 46 14 Z"
          fill={isTeal ? "#FFFFFF" : "#0F766E"}
        />
        <path
          d="M51 24 C 51 24 66 43 78 57 C 80 59 70 61 55 61 C 53 46 51 24 51 24 Z"
          fill={isTeal ? "#E0F2FE" : "#0B4B46"}
        />
        <path
          d="M44 34 C 44 34 32 48 24 57 C 33 60 42 60 44 59 C 44 49 44 34 44 34 Z"
          fill={isTeal ? "#B2DFDB" : "#0D9488"}
          opacity="0.8"
        />
        {/* Gold Wave Hull */}
        <path
          d="M16 68 C 30 65 44 74 62 72 C 76 70 86 64 90 60 C 86 75 68 83 48 83 C 30 83 18 76 16 68 Z"
          fill="#F59E0B"
        />
        <path
          d="M32 76 C 44 74 54 78 68 76 C 76 74 84 69 84 69 C 78 77 64 81 50 81 C 38 81 30 78 32 76 Z"
          fill="#D97706"
        />
      </svg>
    </div>
  );
}
