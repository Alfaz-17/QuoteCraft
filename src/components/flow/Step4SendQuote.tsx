"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  QuotationState, 
  CURRENCY_SYMBOLS, 
  QUOTATION_TEMPLATES 
} from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  MessageCircle, 
  ArrowLeft, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Ship,
  FileText
} from "lucide-react";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { calculateSubtotal, calculateGrandTotal } from "@/utils/calculations";
import { MarineTemplate } from "@/components/preview/MarineTemplate";
import { useToast } from "@/components/ui/Toast";

interface Step4SendQuoteProps {
  state: QuotationState;
  onUpdateClient: (client: Partial<QuotationState["client"]>) => void;
  onUpdateDocInfo?: (docInfo: Partial<QuotationState["documentInfo"]>) => void;
  onUpdateState?: (updates: Partial<QuotationState>) => void;
  onBack: () => void;
  onNewQuote: () => void;
}

export function Step4SendQuote({
  state,
  onUpdateState,
  onBack,
  onNewQuote,
}: Step4SendQuoteProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Settings states synced with state or fallback
  const orientation = state.pdfOrientation || "portrait";
  const [showLogo, setShowLogo] = useState(true);
  const [showSignature, setShowSignature] = useState(state.pdfShowSignatureBlock ?? true);
  const [selectedTemplate, setSelectedTemplate] = useState("Marine Professional");

  const currencySymbol = CURRENCY_SYMBOLS[state.currency] || "$";
  const subtotal = calculateSubtotal(state.items, state.tableColumns);
  const grandTotal = calculateGrandTotal(
    subtotal,
    state.discount,
    state.discountType,
    state.taxPercent,
    state.shippingCharge
  );

  const formattedTotal = `${currencySymbol} ${grandTotal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // 1. Download PDF handler
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      await generateProfessionalPDF(state);
      toastSuccess("Professional PDF quotation downloaded successfully!");
    } catch (err: unknown) {
      toastError((err as Error).message || "Failed to generate PDF document.");
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Share on WhatsApp handler
  const handleShareWhatsApp = () => {
    const rawPhone = (state.client.phone || "").replace(/[^0-9]/g, "");
    const clientName = state.client.companyName || state.client.name || "Sir/Madam";
    const quoteNo = state.documentInfo.number || "QUOTATION";
    const vesselName = state.documentInfo.vessel ? ` for vessel *${state.documentInfo.vessel}*` : "";
    const companyName = state.company.name || "Our Team";

    const messageLines = [
      `*QUOTATION: ${quoteNo}*`,
      `Dear ${clientName},`,
      "",
      `Thank you for your enquiry${vesselName}. We are pleased to quote for *${state.items.length} item(s)*.`,
      "",
      `*Total Amount:* *${formattedTotal}*`,
      state.terms ? `*Terms:* ${state.terms.split("\n")[0]}` : "",
      "",
      `Regards,`,
      `*${companyName}*`,
      state.company.phone ? `Tel: ${state.company.phone}` : "",
    ].filter(Boolean);

    const fullText = messageLines.join("\n");
    const encoded = encodeURIComponent(fullText);

    const whatsappUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(whatsappUrl, "_blank");
    toastSuccess("WhatsApp message prepared! Attach the PDF to complete sending.");
  };

  const handleOrientationChange = (newOrientation: "portrait" | "landscape") => {
    if (onUpdateState) {
      onUpdateState({ pdfOrientation: newOrientation });
    }
  };

  const handleSignatureToggle = (enabled: boolean) => {
    setShowSignature(enabled);
    if (onUpdateState) {
      onUpdateState({ pdfShowSignatureBlock: enabled });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-5 sm:py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            PDF Preview & Finalize
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Review your quotation document layout, configure orientation, and export or share.
          </p>
        </div>

        {/* Mobile Orientation Pills (Screen 7 in Mobile Mockup) */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => handleOrientationChange("portrait")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
              orientation === "portrait"
                ? "bg-[#0F766E] text-white border-[#0F766E] shadow-xs"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            Portrait
          </button>
          <button
            type="button"
            onClick={() => handleOrientationChange("landscape")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
              orientation === "landscape"
                ? "bg-[#0F766E] text-white border-[#0F766E] shadow-xs"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            Landscape
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewQuote}
            className="h-9 px-3.5 rounded-xl text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Create Another Quote
          </Button>
        </div>
      </div>

      {/* Screen 6 Split Grid: Left Preview Settings (4 cols) | Right Live A4 Sheet (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Preview Settings Panel */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0F766E]" />
            Preview Settings
          </h3>

          {/* Orientation Toggle: Portrait vs Landscape */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Orientation</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOrientationChange("portrait")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  orientation === "portrait"
                    ? "bg-[#0F766E] text-white border-[#0F766E] shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Portrait
              </button>

              <button
                type="button"
                onClick={() => handleOrientationChange("landscape")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  orientation === "landscape"
                    ? "bg-[#0F766E] text-white border-[#0F766E] shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Active Template & Brand Info Card (Customizable in Settings) */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Template & Branding
              </span>
              <Link
                href="/settings"
                className="text-[11px] font-bold text-[#0F766E] hover:underline flex items-center gap-0.5"
              >
                Change in Settings →
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-0.5">
              <div
                className="w-5 h-5 rounded-lg border border-slate-300 shrink-0 shadow-2xs"
                style={{ backgroundColor: state.branding.primaryColor || "#0F766E" }}
                title={`Primary Color: ${state.branding.primaryColor || "#0F766E"}`}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {QUOTATION_TEMPLATES.find((t) => t.id === (state.branding.layout || "marine"))?.name || "Marine Professional"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  Typography: {state.branding.font || "Manrope"}
                </p>
              </div>
            </div>
          </div>

          {/* Toggles: Show Logo & Footer Note */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Show Logo</span>
              <button
                type="button"
                onClick={() => setShowLogo(!showLogo)}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  showLogo ? "bg-[#0F766E]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    showLogo ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Footer Note & Signature</span>
              <button
                type="button"
                onClick={() => handleSignatureToggle(!showSignature)}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  showSignature ? "bg-[#0F766E]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    showSignature ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons: Download PDF & WhatsApp */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-md shadow-[#0F766E]/20 min-h-[44px]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleShareWhatsApp}
              className="w-full h-10 rounded-xl font-bold text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 min-h-[40px]"
            >
              <MessageCircle className="w-4 h-4 mr-2 text-emerald-600" /> Share on WhatsApp
            </Button>
          </div>
        </div>

        {/* Right: Live A4 Quotation Sheet & Zoom Bar */}
        <div className="lg:col-span-8 space-y-3">
          {/* Zoom Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-2 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <Ship className="w-3.5 h-3.5 text-[#0F766E] mr-1" />
              <span>A4 Live Document</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                className="w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-700 px-1">
                {zoomLevel}%
              </span>

              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                className="w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sheet Canvas Container */}
          <div className="bg-slate-200/60 rounded-3xl p-4 sm:p-8 flex justify-center overflow-x-auto shadow-inner border border-slate-200">
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className="shrink-0"
            >
              <div className="shadow-2xl rounded-sm overflow-hidden bg-white">
                <MarineTemplate data={state} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Footer (Screen 7 in Mobile Mockup: Download PDF | Share) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-11 px-4 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <Button
              variant="outline"
              onClick={handleShareWhatsApp}
              className="h-11 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50 min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600" /> Share
            </Button>

            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex-1 sm:flex-initial h-11 px-6 sm:px-7 rounded-xl font-bold text-xs sm:text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-md shadow-[#0F766E]/20 min-h-[44px]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" /> Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
