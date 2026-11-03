"use client";

import { QuotationState } from "@/types/quotation.types";
import { MarineTemplate } from "./MarineTemplate";
import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, Maximize2, Layout, FileText, Check } from "lucide-react";

interface PreviewContainerProps {
  data: QuotationState;
  isMobile?: boolean;
  onUpdateState?: (updates: Partial<QuotationState>) => void;
}

export function PreviewContainer({ data, onUpdateState }: PreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localOrientation, setLocalOrientation] = useState<"portrait" | "landscape">(data.pdfOrientation || "portrait");
  const [localLayoutMode, setLocalLayoutMode] = useState<"clean" | "detailed">(data.pdfLayoutMode || "clean");

  const effectiveOrientation = onUpdateState ? (data.pdfOrientation || "portrait") : localOrientation;
  const effectiveLayoutMode = onUpdateState ? (data.pdfLayoutMode || "clean") : localLayoutMode;
  const isLandscape = effectiveOrientation === "landscape";
  const isCleanMode = effectiveLayoutMode !== "detailed";
  const targetWidth = isLandscape ? 1123 : 794; // A4 96dpi

  const [scale, setScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<"fit" | "actual">("fit");

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    if (zoomMode === "actual") {
      setScale(1);
      return;
    }
    const containerWidth = containerRef.current.offsetWidth - 32; // padding
    if (containerWidth < targetWidth) {
      setScale(Math.max(0.3, containerWidth / targetWidth));
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

  return (
    <div className="w-full flex flex-col bg-slate-100/80 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
      {/* Document Layout & Zoom Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-200 gap-2 text-xs">
        {/* Left: Orientation & Layout Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleToggleOrientation("portrait")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                !isLandscape
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Portrait</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleOrientation("landscape")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                isLandscape
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layout className="w-3.5 h-3.5 rotate-90" />
              <span>Landscape</span>
            </button>
          </div>

          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleToggleLayoutMode("clean")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                isCleanMode
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Clean marine format: Technical specifications rendered underneath item names"
            >
              {isCleanMode && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
              <span>Standard Marine</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayoutMode("detailed")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                !isCleanMode
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Detailed grid format: All enabled table columns shown side-by-side"
            >
              {!isCleanMode && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
              <span>All Columns</span>
            </button>
          </div>
        </div>

        {/* Right: Scale Indicator & Zoom Mode */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-slate-400 text-[11px] hidden sm:inline">
            A4 ({Math.round(scale * 100)}%)
          </span>

          <button
            type="button"
            onClick={() => setZoomMode(zoomMode === "fit" ? "actual" : "fit")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
          >
            {zoomMode === "fit" ? (
              <>
                <ZoomIn className="w-3.5 h-3.5 text-primary" />
                <span>100% Zoom</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-primary" />
                <span>Fit Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* A4 Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full flex flex-col items-center p-3 sm:p-6 overflow-x-auto overflow-y-auto"
      >
        <div 
          className="shadow-2xl origin-top transition-all duration-200 rounded-sm overflow-hidden"
          style={{ 
            transform: `scale(${scale})`,
            width: `${targetWidth}px`,
            marginBottom: scale < 1 ? `-${targetWidth * (1 - scale)}px` : "0px",
          }}
        >
          <MarineTemplate data={{ ...data, pdfOrientation: effectiveOrientation, pdfLayoutMode: effectiveLayoutMode }} />
        </div>
      </div>
    </div>
  );
}
