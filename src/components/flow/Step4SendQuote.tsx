"use client";

import React, { useState } from "react";
import { QuotationState, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, MessageCircle, ArrowLeft, Loader2, FilePlus, 
  Eye, Phone, CheckCircle2, Building, User
} from "lucide-react";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { calculateSubtotal, calculateGrandTotal } from "@/utils/calculations";
import { PreviewContainer } from "@/components/preview/PreviewContainer";
import { useToast } from "@/components/ui/Toast";

interface Step4SendQuoteProps {
  state: QuotationState;
  onUpdateClient: (client: Partial<QuotationState["client"]>) => void;
  onUpdateDocInfo: (docInfo: Partial<QuotationState["documentInfo"]>) => void;
  onBack: () => void;
  onNewQuote: () => void;
}

export function Step4SendQuote({
  state,
  onUpdateClient,
  onUpdateDocInfo,
  onBack,
  onNewQuote,
}: Step4SendQuoteProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[state.currency] || "₹";
  const subtotal = calculateSubtotal(state.items, state.tableColumns);
  const grandTotal = calculateGrandTotal(
    subtotal,
    state.discount,
    state.discountType,
    state.taxPercent,
    state.shippingCharge
  );

  const formattedTotal = `${currencySymbol} ${grandTotal.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // 1. Download PDF handler
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      await generateProfessionalPDF(state);
      toastSuccess("PDF downloaded successfully!");
    } catch (err: any) {
      toastError(err.message || "Failed to generate PDF document.");
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Share on WhatsApp handler (Principle 6)
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
    toastSuccess("WhatsApp message prepared! Please attach the PDF if needed.");
  };

  return (
    <div className="max-w-5xl mx-auto py-5 sm:py-8 px-3 sm:px-6 space-y-6 animate-in fade-in duration-300">
      {/* Native Share Sheet Top Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quotation Ready
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Grand Total: <span className="font-bold font-mono text-slate-900 text-base">{formattedTotal}</span> • {state.items.length} items
            </p>
          </div>

          {/* Principle 6: Native Touch Buttons (>= 48px height) */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="h-12 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 min-h-[48px] flex items-center gap-2 flex-1 sm:flex-initial active:scale-[0.98]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download PDF
                </>
              )}
            </Button>

            <Button
              onClick={handleShareWhatsApp}
              className="h-12 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-emerald-500/20 min-h-[48px] flex items-center gap-2 flex-1 sm:flex-initial active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> Share on WhatsApp
            </Button>
          </div>
        </div>

        {/* Recipient Details (For WhatsApp & PDF header) */}
        <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recipient Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Buyer Company</Label>
              <Input
                value={state.client.companyName || state.client.name || ""}
                onChange={(e) =>
                  onUpdateClient({ companyName: e.target.value, name: e.target.value })
                }
                placeholder="e.g. V.Ships / Anglo Eastern"
                className="h-9 text-xs sm:text-sm font-semibold bg-white rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Attention (Person)</Label>
              <Input
                value={state.client.attn || ""}
                onChange={(e) => onUpdateClient({ attn: e.target.value })}
                placeholder="e.g. Capt. Sharma"
                className="h-9 text-xs sm:text-sm font-semibold bg-white rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Number
              </Label>
              <Input
                value={state.client.phone || ""}
                onChange={(e) => onUpdateClient({ phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-9 text-xs sm:text-sm font-mono font-bold bg-white rounded-xl border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Live Document Preview with Paper Shadow */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" /> Live Document Preview
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Standard Marine Format</span>
          </div>

          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-100 flex justify-center py-6">
            <div className="w-full max-w-[794px] shadow-xl rounded-lg overflow-hidden bg-white">
              <PreviewContainer data={state} isMobile={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 px-5 rounded-2xl font-bold text-xs border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Prices
        </Button>

        <Button
          variant="secondary"
          onClick={onNewQuote}
          className="h-11 px-6 rounded-2xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 active:scale-95"
        >
          <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Start New Quote
        </Button>
      </div>
    </div>
  );
}
