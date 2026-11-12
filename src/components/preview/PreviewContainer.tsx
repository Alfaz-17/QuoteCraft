"use client";

import { QuotationState } from "@/types/quotation.types";
import { MarineTemplate } from "./MarineTemplate";
import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, Maximize2, Layout, FileText, Check, PenLine } from "lucide-react";

interface PreviewContainerProps {
  data: QuotationState;
  isMobile?: boolean;
  onUpdateState?: (updates: Partial<QuotationState>) => void;
}

export function PreviewContainer({ data, onUpdateState }: PreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localOrientation, setLocalOrientation] = useState<"portrait" | "landscape">(data.pdfOrientation || "portrait");
  const [localLayoutMode, setLocalLayoutMode] = useState<"clean" | "detailed">(data.pdfLayoutMode || "clean");
  const [localShowSignature, setLocalShowSignature] = useState<boolean>(data.pdfShowSignatureBlock !== false);

  const effectiveOrientation = onUpdateState ? (data.pdfOrientation || "portrait") : localOrientation;
  const effectiveLayoutMode = onUpdateState ? (data.pdfLayoutMode || "clean") : localLayoutMode;
  const effectiveShowSignature = onUpdateState ? (data.pdfShowSignatureBlock !== false) : localShowSignature;
  const isLandscape = effectiveOrientation === "landscape";
  const isCleanMode = effectiveLayoutMode !== "detailed";
  const targetWidth = isLandscape ? 1123 : 794; // A4 96dpi
  const targetHeight = isLandscape ? 794 : 1123; // A4 96dpi

  const [scale, setScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<"fit" | "actual">("fit");

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    if (zoomMode === "actual") {
      setScale(1);
      return;
    }
    const containerWidth = containerRef.current.offsetWidth - 24; // padding
    if (containerWidth < targetWidth) {
      setScale(Math.max(0.28, containerWidth / targetWidth));
    } else {
      setScale(1);
    }
  }, [zoomMode, targetWidth]);

  useEffect(() => {
    const handleResize = () => {
      updateScale();
    };
    const frame = requestAnimationFrame(handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateScale]);

  const handleToggleOrientation = (orientation: "portrait" | "landscape") => {
    setLocalOrientation(orientation);
    if (onUpdateState) {
      onUpdateState({ pdfOrientation: orientation });
    }
  };

  const handleToggleLayoutMode = (mode: "clean" | "detailed") => {
    setLocalLayoutMode(mode);
    if (onUpdateState) {
      onUpdateState({ pdfLayoutMode: mode });
    }
  };

  const handleToggleSignature = (enabled: boolean) => {
    setLocalShowSignature(enabled);
    if (onUpdateState) {
      onUpdateState({ pdfShowSignatureBlock: enabled });
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-100/80 rounded-lg overflow-hidden border border-slate-200/90 shadow-sm">
      {/* Document Layout & Zoom Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-white border-b border-slate-200 gap-2 text-xs">
        {/* Left: Orientation & Layout Mode Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleToggleOrientation("portrait")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs transition-all min-h-[38px] ${
                !isLandscape
                  ? "bg-white text-[#0F766E] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Portrait Orientation"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden min-[400px]:inline">Portrait</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleOrientation("landscape")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs transition-all min-h-[38px] ${
                isLandscape
                  ? "bg-white text-[#0F766E] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Landscape Orientation"
            >
              <Layout className="w-3.5 h-3.5 rotate-90" />
              <span className="hidden min-[400px]:inline">Landscape</span>
            </button>
          </div>

          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleToggleLayoutMode("clean")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs transition-all min-h-[38px] ${
                isCleanMode
                  ? "bg-white text-[#0F766E] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Clean marine format: Technical specifications rendered underneath item names"
            >
              {isCleanMode && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
              <span>Standard</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayoutMode("detailed")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs transition-all min-h-[38px] ${
                !isCleanMode
                  ? "bg-white text-[#0F766E] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Detailed grid format: All enabled table columns shown side-by-side"
            >
              {!isCleanMode && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
              <span>Columns</span>
            </button>
          </div>

          {/* Signature Block Toggle */}
          <button
            type="button"
            onClick={() => handleToggleSignature(!effectiveShowSignature)}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border font-bold text-xs transition-all min-h-[38px] ${
              effectiveShowSignature
                ? "bg-white border-teal-300 text-[#0F766E] shadow-2xs"
                : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
            title="Toggle formal Authorized Signature & Stamp seal on quotation and exported PDF"
          >
            <PenLine className="w-3.5 h-3.5 text-[#0F766E]" />
            <span className="hidden sm:inline">Sign:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              effectiveShowSignature ? "bg-teal-50 text-[#0F766E]" : "bg-slate-200 text-slate-600"
            }`}>
              {effectiveShowSignature ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Right: Scale Indicator & Zoom Mode */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-slate-500 text-xs hidden sm:inline">
            A4 ({Math.round(scale * 100)}%)
          </span>

          <button
            type="button"
            onClick={() => setZoomMode(zoomMode === "fit" ? "actual" : "fit")}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors min-h-[38px]"
          >
            {zoomMode === "fit" ? (
              <>
                <ZoomIn className="w-3.5 h-3.5 text-[#0F766E]" />
                <span className="hidden sm:inline">100% Zoom</span>
                <span className="sm:hidden">100%</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#0F766E]" />
                <span className="hidden sm:inline">Fit Screen</span>
                <span className="sm:hidden">Fit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* A4 Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full flex flex-col items-center p-2 sm:p-6 overflow-x-hidden overflow-y-auto"
      >
        <div 
          className="shadow-2xl origin-top transition-all duration-200 rounded-sm overflow-hidden"
          style={{ 
            transform: `scale(${scale})`,
            width: `${targetWidth}px`,
            marginBottom: scale < 1 ? `-${Math.round(targetHeight * (1 - scale))}px` : "0px",
          }}
        >
          <MarineTemplate data={{ ...data, pdfOrientation: effectiveOrientation, pdfLayoutMode: effectiveLayoutMode, pdfShowSignatureBlock: effectiveShowSignature }} />
        </div>
      </div>
    </div>
  );
}
