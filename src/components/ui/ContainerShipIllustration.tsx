"use client";

import React from "react";

interface ContainerShipProps {
  className?: string;
  variant?: "hero" | "banner" | "compact";
}

export function ContainerShipIllustration({
  className = "",
  variant = "banner",
}: ContainerShipProps) {
  if (variant === "compact") {
    return (
      <svg
        viewBox="0 0 160 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Simplified Container Ship */}
        {/* Water */}
        <path d="M0 65 Q 40 62, 80 65 T 160 65 L 160 80 L 0 80 Z" fill="#E0F2F1" />
        <path d="M10 68 Q 50 66, 90 68 T 160 68 L 160 80 L 10 80 Z" fill="#0F766E" opacity="0.15" />

        {/* Hull */}
        <path
          d="M15 58 L 140 58 Q 148 58, 152 52 L 146 62 Q 138 66, 25 66 L 15 58 Z"
          fill="#0F766E"
        />
        {/* Red / Gold Waterline */}
        <path d="M22 62 L 142 62 L 145 64 L 20 64 Z" fill="#F59E0B" />

        {/* Superstructure / Bridge */}
        <rect x="25" y="36" width="22" height="22" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="28" y="40" width="16" height="4" rx="1" fill="#0F766E" opacity="0.4" />
        <line x1="36" y1="28" x2="36" y2="36" stroke="#475569" strokeWidth="1.5" />
        <line x1="32" y1="31" x2="40" y2="31" stroke="#475569" strokeWidth="1" />

        {/* Stacks of Containers */}
        {/* Tier 1 */}
        <rect x="52" y="48" width="16" height="10" rx="1" fill="#0F766E" />
        <rect x="70" y="48" width="16" height="10" rx="1" fill="#F59E0B" />
        <rect x="88" y="48" width="16" height="10" rx="1" fill="#475569" />
        <rect x="106" y="48" width="16" height="10" rx="1" fill="#0D9488" />
        <rect x="124" y="48" width="14" height="10" rx="1" fill="#E0F2F1" stroke="#0F766E" strokeWidth="0.5" />

        {/* Tier 2 */}
        <rect x="54" y="39" width="16" height="8" rx="1" fill="#D97706" />
        <rect x="72" y="39" width="16" height="8" rx="1" fill="#0F766E" />
        <rect x="90" y="39" width="16" height="8" rx="1" fill="#F59E0B" />
        <rect x="108" y="39" width="14" height="8" rx="1" fill="#334155" />

        {/* Tier 3 */}
        <rect x="74" y="32" width="16" height="6" rx="1" fill="#0F766E" />
        <rect x="92" y="32" width="14" height="6" rx="1" fill="#FDE68A" stroke="#D97706" strokeWidth="0.5" />
      </svg>
    );
  }

  // Detailed Banner / Hero Illustration
  return (
    <svg
      viewBox="0 0 420 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B4B46" />
          <stop offset="60%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#042F2C" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F2F1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B2DFDB" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Sea Wake / Water ripple */}
      <ellipse cx="230" cy="155" rx="180" ry="12" fill="url(#waterGrad)" />
      <path
        d="M20 152 Q 120 148, 220 152 T 410 152"
        stroke="#0F766E"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        strokeDasharray="8 4"
      />
      <path
        d="M60 158 Q 160 155, 260 158 T 390 158"
        stroke="#F59E0B"
        strokeWidth="1"
        strokeOpacity="0.25"
      />

      {/* Bow Wave Foam */}
      <path
        d="M365 145 Q 380 148, 395 152 Q 380 153, 360 151 Z"
        fill="#FFFFFF"
        opacity="0.8"
      />
      <path
        d="M370 148 C 385 150, 400 153, 405 156"
        stroke="#0F766E"
        strokeWidth="2"
        strokeOpacity="0.3"
        strokeLinecap="round"
      />

      {/* Main Hull */}
      <path
        d="M45 125 
           L 345 125 
           C 362 125, 375 120, 385 110 
           L 370 140 
           C 358 147, 335 150, 70 150 
           C 52 150, 44 144, 45 125 Z"
        fill="url(#hullGrad)"
      />

      {/* Waterline Stripe (Gold Accent) */}
      <path
        d="M58 138 L 350 138 C 358 138, 364 136, 368 133 L 366 141 C 360 143, 350 145, 62 145 Z"
        fill="url(#goldRibbon)"
      />

      {/* Hull Sheer & Railing */}
      <line x1="48" y1="124" x2="350" y2="124" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
      <line x1="52" y1="121" x2="348" y2="121" stroke="#CBD5E1" strokeWidth="0.8" opacity="0.5" />

      {/* Bridge / Superstructure Tower (Aft) */}
      <g>
        {/* Main Deckhouse */}
        <rect x="68" y="70" width="46" height="54" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="74" y="62" width="34" height="12" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="78" y="52" width="26" height="12" rx="2" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1" />
        {/* Navigation Bridge Windows */}
        <rect x="80" y="55" width="22" height="4" rx="1" fill="#0F766E" />
        <rect x="72" y="76" width="38" height="3" rx="0.5" fill="#475569" opacity="0.6" />
        <rect x="72" y="85" width="38" height="3" rx="0.5" fill="#475569" opacity="0.6" />
        <rect x="72" y="94" width="38" height="3" rx="0.5" fill="#475569" opacity="0.6" />

        {/* Funnel / Exhaust Stack */}
        <rect x="52" y="75" width="12" height="30" rx="2" fill="#0F766E" />
        <rect x="52" y="72" width="12" height="4" fill="#042F2C" />
        <rect x="54" y="79" width="8" height="8" rx="1" fill="#F59E0B" />

        {/* Radar Mast */}
        <line x1="91" y1="36" x2="91" y2="52" stroke="#334155" strokeWidth="2" />
        <line x1="84" y1="42" x2="98" y2="42" stroke="#334155" strokeWidth="1.5" />
        <line x1="86" y1="47" x2="96" y2="47" stroke="#334155" strokeWidth="1" />
        <circle cx="91" cy="35" r="2" fill="#F59E0B" />
      </g>

      {/* Cargo Container Stacks (Precision 20ft & 40ft Containers) */}
      <g>
        {/* Bay 1 (Behind bridge) */}
        {/* Tier 1 - Base */}
        <rect x="122" y="105" width="36" height="19" rx="1.5" fill="#0F766E" stroke="#0B4B46" strokeWidth="0.8" />
        <line x1="134" y1="106" x2="134" y2="123" stroke="#0B4B46" strokeWidth="0.5" />
        <line x1="146" y1="106" x2="146" y2="123" stroke="#0B4B46" strokeWidth="0.5" />

        <rect x="162" y="105" width="36" height="19" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
        <line x1="174" y1="106" x2="174" y2="123" stroke="#D97706" strokeWidth="0.5" />
        <line x1="186" y1="106" x2="186" y2="123" stroke="#D97706" strokeWidth="0.5" />

        <rect x="202" y="105" width="36" height="19" rx="1.5" fill="#334155" stroke="#1E293B" strokeWidth="0.8" />
        <line x1="214" y1="106" x2="214" y2="123" stroke="#1E293B" strokeWidth="0.5" />
        <line x1="226" y1="106" x2="226" y2="123" stroke="#1E293B" strokeWidth="0.5" />

        <rect x="242" y="105" width="36" height="19" rx="1.5" fill="#0D9488" stroke="#0F766E" strokeWidth="0.8" />
        <rect x="282" y="105" width="36" height="19" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
        <rect x="322" y="105" width="28" height="19" rx="1.5" fill="#0F766E" stroke="#0B4B46" strokeWidth="0.8" />

        {/* Tier 2 */}
        <rect x="122" y="85" width="36" height="19" rx="1.5" fill="#D97706" stroke="#B45309" strokeWidth="0.8" />
        <rect x="162" y="85" width="36" height="19" rx="1.5" fill="#0F766E" stroke="#0B4B46" strokeWidth="0.8" />
        <rect x="202" y="85" width="36" height="19" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
        <rect x="242" y="85" width="36" height="19" rx="1.5" fill="#475569" stroke="#334155" strokeWidth="0.8" />
        <rect x="282" y="85" width="36" height="19" rx="1.5" fill="#0D9488" stroke="#0F766E" strokeWidth="0.8" />
        <rect x="322" y="85" width="24" height="19" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />

        {/* Tier 3 */}
        <rect x="124" y="65" width="34" height="19" rx="1.5" fill="#0F766E" stroke="#0B4B46" strokeWidth="0.8" />
        <rect x="162" y="65" width="36" height="19" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
        <rect x="202" y="65" width="36" height="19" rx="1.5" fill="#0F766E" stroke="#0B4B46" strokeWidth="0.8" />
        <rect x="242" y="65" width="36" height="19" rx="1.5" fill="#D97706" stroke="#B45309" strokeWidth="0.8" />
        <rect x="282" y="65" width="34" height="19" rx="1.5" fill="#334155" stroke="#1E293B" strokeWidth="0.8" />

        {/* Tier 4 (Top row) */}
        <rect x="164" y="47" width="34" height="17" rx="1.5" fill="#0D9488" stroke="#0F766E" strokeWidth="0.8" />
        <rect x="202" y="47" width="36" height="17" rx="1.5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
        <rect x="242" y="47" width="34" height="17" rx="1.5" fill="#0F766E" stroke="#0B4B46" strokeWidth="0.8" />
      </g>

      {/* Forecastle & Mooring Winches (Bow) */}
      <path d="M348 116 L 368 116 L 372 124 L 348 124 Z" fill="#F1F5F9" />
      <circle cx="360" cy="119" r="2.5" fill="#64748B" />
      <line x1="368" y1="110" x2="368" y2="124" stroke="#475569" strokeWidth="1" />
      <circle cx="368" cy="109" r="1.5" fill="#F59E0B" />
    </svg>
  );
}

