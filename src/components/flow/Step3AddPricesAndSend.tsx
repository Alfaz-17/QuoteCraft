"use client";

import React, { useRef, useState, useMemo } from "react";
import { 
  QuotationState, 
  LineItem, 
  Currency, 
  CURRENCY_SYMBOLS 
} from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  MessageCircle, 
  Copy, 
  Check, 
  ChevronDown,
  Mail,
  X,
  Plus
} from "lucide-react";
import { 
  calculateSubtotal, 
  calculateDiscountAmount, 
  calculateTaxAmount, 
  calculateGrandTotal, 
  getRoleKey, 
  toNumber 
} from "@/utils/calculations";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { PreviewContainer } from "@/components/preview/PreviewContainer";
import { useToast } from "@/components/ui/Toast";
import { DualOrbitalSpinner } from "@/components/ui/Loaders";
import { StepHeader } from "./StepHeader";

interface Step3AddPricesAndSendProps {
  state: QuotationState;
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void;
  onBatchUpdatePrices: (updates: { id: string; price: number }[]) => void;
  onSetCurrency: (curr: Currency) => void;
  onSetDiscount: (amount: number, type: "flat" | "percent") => void;
  onSetTaxPercent: (tax: number) => void;
  onSetShipping: (shipping: number) => void;
  onUpdateClient: (client: Partial<QuotationState["client"]>) => void;
  onUpdateDocInfo: (docInfo: Partial<QuotationState["documentInfo"]>) => void;
  onUpdateState?: (updates: Partial<QuotationState>) => void;
  onBack: () => void;
  onNewQuote: () => void;
}

export function Step3AddPricesAndSend({
  state,
  onUpdateItem,
  onBatchUpdatePrices,
  onSetCurrency,
  onSetDiscount,
  onSetTaxPercent,
  onSetShipping,
  onUpdateClient,
  onUpdateDocInfo,
  onUpdateState,
  onBack,
}: Step3AddPricesAndSendProps) {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Stage: Section A ("pricing") vs Section B ("preview")
  const [stage, setStage] = useState<"pricing" | "preview">("pricing");
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Collapsible accordion states in Section A
  const [openCharges, setOpenCharges] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openVessel, setOpenVessel] = useState(false);

  const { items, tableColumns, currency, discount, discountType, taxPercent, shippingCharge } = state;
  const currencySymbol = CURRENCY_SYMBOLS[currency] || "$";
  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";
  const priceKey = getRoleKey(tableColumns, "price") ?? "unitPrice";

  // Calculations
  const subtotal = calculateSubtotal(items, tableColumns);
  const discountAmt = calculateDiscountAmount(subtotal, discount, discountType);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxAmt = calculateTaxAmount(afterDiscount, taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, discount, discountType, taxPercent, shippingCharge);

  const unpricedItems = useMemo(() => {
    return items.filter((item) => {
      if (item.isTba) return false;
      const p = toNumber(item[priceKey] ?? item.unitPrice);
      return !p || p <= 0;
    });
  }, [items, priceKey]);

  const formattedTotal = `${currencySymbol}${grandTotal.toLocaleString(
    currency === "INR" ? "en-IN" : "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )}`;

  // Keyboard navigation down price column
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (unpricedItems.length > 0) {
      toastInfo(`Notice: ${unpricedItems.length} item(s) currently priced at 0.`);
    }

    setIsDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      await generateProfessionalPDF(state);
      toastSuccess("PDF Quotation downloaded successfully!");
    } catch (err: unknown) {
      toastError((err as Error).message || "Failed to generate PDF document.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Share on WhatsApp
  const handleShareWhatsApp = () => {
    const rawPhone = (state.client.phone || "").replace(/[^0-9]/g, "");
    const clientName = state.client.companyName || state.client.name || "Customer";
    const quoteNo = state.documentInfo.number || "QUOTATION";
    const vesselName = state.documentInfo.vessel ? ` for vessel *${state.documentInfo.vessel}*` : "";
    const companyName = state.company.name || "Our Company";

    const messageLines = [
      `*QUOTATION: ${quoteNo}*`,
      `Dear ${clientName},`,
      "",
      `Thank you for your enquiry${vesselName}. We are pleased to quote for *${items.length} item(s)*.`,
      "",
      `*Grand Total:* *${formattedTotal}*`,
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
    toastSuccess("WhatsApp opened! You can now send the message and attach the PDF.");
  };

  // Email quote
  const handleShareEmail = () => {
    const quoteNo = state.documentInfo.number || "QUOTATION";
    const clientName = state.client.companyName || state.client.name || "Customer";
    const emailTo = state.client.email || "";
    const subject = encodeURIComponent(`Quotation ${quoteNo} - ${clientName}`);
    const body = encodeURIComponent(
      `Dear ${clientName},\n\nPlease find our quotation ${quoteNo} totaling ${formattedTotal} for ${items.length} item(s).\n\nBest regards,\n${state.company.name || "Sales Team"}`
    );
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, "_blank");
  };

  // Copy summary
  const handleCopySummary = () => {
    const quoteNo = state.documentInfo.number || "QUOTATION";
    const clientName = state.client.companyName || state.client.name || "Customer";
    const summary = `Quotation ${quoteNo} for ${clientName}: ${items.length} items, Total: ${formattedTotal}`;
    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    toastSuccess("Quotation summary copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // ══════════════════════════════════════════════════
  // SECTION B: PREVIEW & SEND SCREEN
  // ══════════════════════════════════════════════════
  if (stage === "preview") {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
        {/* Preview Sub-Header */}
        <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setStage("pricing")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100 min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Pricing</span>
          </button>

          <div className="text-center">
            <span className="text-xs font-mono font-bold text-slate-700">
              {state.documentInfo.number || "Draft"}
            </span>
            <h3 className="text-sm font-black text-[#172033] leading-none">
              Quotation Preview
            </h3>
          </div>

          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Scrollable PDF Viewer */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 max-w-3xl mx-auto w-full pb-24">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-2 sm:p-4 shadow-sm overflow-hidden">
            <PreviewContainer data={state} onUpdateState={onUpdateState} />
          </div>
        </div>

        {/* Sticky Bottom Actions: Download PDF (Primary) + Share Quotation (Secondary) */}
        <footer className="shrink-0 border-t border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs text-[#64748B] block">Total:</span>
              <span className="font-mono font-black text-base sm:text-lg text-[#347A72]">
                {formattedTotal}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(true)}
                className="h-12 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50 min-h-[48px]"
              >
                <span>Share Quotation</span>
              </Button>

              <Button
                disabled={isDownloading}
                onClick={handleDownloadPDF}
                className="h-12 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm bg-[#347A72] hover:bg-[#28645E] text-white shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isDownloading ? (
                  <>
                    <DualOrbitalSpinner size="sm" className="mr-1.5" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </footer>

        {/* Share Modal / BottomSheet */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-[#172033]">
                  Share Quotation
                </h3>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    handleShareWhatsApp();
                  }}
                  className="w-full p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 font-bold text-sm flex items-center gap-3 transition-colors text-left min-h-[48px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm">Send via WhatsApp</p>
                    <p className="text-xs text-emerald-700 font-normal">
                      Opens WhatsApp with formatted quotation text
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    handleShareEmail();
                  }}
                  className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm flex items-center gap-3 transition-colors text-left min-h-[48px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm">Send via Email</p>
                    <p className="text-xs text-slate-500 font-normal">
                      Opens your mail client with prefilled details
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    handleCopySummary();
                  }}
                  className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm flex items-center gap-3 transition-colors text-left min-h-[48px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    {copiedLink ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm">{copiedLink ? "Copied to Clipboard" : "Copy Summary Text"}</p>
                    <p className="text-xs text-slate-500 font-normal">
                      Quick overview to paste anywhere
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // SECTION A: PRICING SCREEN
  // ══════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      {/* Scrollable Pricing Form */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 max-w-2xl mx-auto w-full space-y-4 pb-28">
        {/* Step Progress & Title */}
        <StepHeader
          step={3}
          title="Pricing"
          subtitle="Enter unit prices and quotation details."
        />

        {/* Currency Selector Strip */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-xs">
          <span className="text-xs font-semibold text-[#64748B]">Currency:</span>
          <select
            value={currency}
            onChange={(e) => onSetCurrency(e.target.value as Currency)}
            className="h-8 px-2.5 rounded-lg border border-slate-300 font-bold text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#347A72]"
          >
            {Object.keys(CURRENCY_SYMBOLS).map((c) => (
              <option key={c} value={c}>
                {c} ({CURRENCY_SYMBOLS[c as Currency]})
              </option>
            ))}
          </select>
        </div>

        {/* Pricing Items List */}
        <div className="space-y-3">
          {items.map((item, idx) => {
            const qty = toNumber(item[qtyKey] ?? item.quantity) || 1;
            const price = toNumber(item[priceKey] ?? item.unitPrice) || 0;
            const lineTotal = item.isTba ? 0 : qty * price;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-[#172033] truncate">
                      {item.itemName || "Unnamed Item"}
                    </p>
                    <p className="text-xs text-[#64748B] font-medium mt-0.5">
                      Quantity: <strong className="text-slate-800">{qty} {item.unit || "PCS"}</strong>
                      {item.partNumber && <span> • Part: <span className="font-mono">{item.partNumber}</span></span>}
                    </p>
                  </div>

                  {/* TBA Toggle */}
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isTba)}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          isTba: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-[#347A72] focus:ring-[#347A72]"
                    />
                    <span>TBA</span>
                  </label>
                </div>

                {/* Price Input Row */}
                {item.isTba ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-500 border border-slate-200 text-center">
                    Price to be advised (TBA) — Excluded from total
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex-1 max-w-[200px]">
                      <Label className="text-xs font-semibold text-[#64748B] block mb-1">
                        Unit Price
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          {currencySymbol}
                        </span>
                        <input
                          ref={(el) => {
                            inputRefs.current[idx] = el;
                          }}
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          inputMode="decimal"
                          enterKeyHint="next"
                          value={price > 0 ? price : ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onUpdateItem(item.id, {
                              unitPrice: val,
                              [priceKey]: val,
                            });
                          }}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          className="w-full h-11 pl-8 pr-3 rounded-xl border border-slate-300 font-mono font-bold text-base text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#347A72]"
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#64748B] block mb-1 font-medium">
                        Total
                      </span>
                      <span className="font-mono font-black text-sm sm:text-base text-[#172033]">
                        {currencySymbol}{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Collapsible Section 1: Additional Charges (Discount, Tax, Shipping) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOpenCharges((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors"
          >
            <div>
              <p className="font-bold text-sm text-[#172033]">Additional Charges</p>
              <p className="text-xs text-[#64748B]">Discount, Tax, and Shipping charge</p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                openCharges ? "rotate-180" : ""
              }`}
            />
          </button>

          {openCharges && (
            <div className="p-4 pt-1 border-t border-slate-100 space-y-3.5 bg-slate-50/40 animate-in fade-in">
              {/* Discount */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Discount</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={discount || ""}
                    placeholder="0"
                    onChange={(e) => onSetDiscount(parseFloat(e.target.value) || 0, discountType)}
                    className="h-10 text-sm font-mono font-bold rounded-xl border-slate-300 bg-white"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => onSetDiscount(discount, e.target.value as "flat" | "percent")}
                    className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-700"
                  >
                    <option value="flat">{currencySymbol} Flat</option>
                    <option value="percent">% Off</option>
                  </select>
                </div>
              </div>

              {/* Tax */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Tax (VAT / GST %)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={taxPercent || ""}
                  placeholder="0 %"
                  onChange={(e) => onSetTaxPercent(parseFloat(e.target.value) || 0)}
                  className="h-10 text-sm font-mono font-bold rounded-xl border-slate-300 bg-white"
                />
              </div>

              {/* Shipping */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Shipping / Delivery Charge</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={shippingCharge || ""}
                  placeholder="0.00"
                  onChange={(e) => onSetShipping(parseFloat(e.target.value) || 0)}
                  className="h-10 text-sm font-mono font-bold rounded-xl border-slate-300 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section 2: Customer Details */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOpenCustomer((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors"
          >
            <div>
              <p className="font-bold text-sm text-[#172033]">Customer Details</p>
              <p className="text-xs text-[#64748B]">
                {state.client.companyName ? state.client.companyName : "Buyer name and contact info"}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                openCustomer ? "rotate-180" : ""
              }`}
            />
          </button>

          {openCustomer && (
            <div className="p-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/40 animate-in fade-in">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Customer / Company Name</Label>
                <Input
                  value={state.client.companyName || ""}
                  onChange={(e) => onUpdateClient({ companyName: e.target.value })}
                  placeholder="e.g. Ocean Marine Ltd."
                  className="h-10 text-sm rounded-xl border-slate-300 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Contact Person</Label>
                <Input
                  value={state.client.name || ""}
                  onChange={(e) => onUpdateClient({ name: e.target.value })}
                  placeholder="e.g. Capt. Smith"
                  className="h-10 text-sm rounded-xl border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Email</Label>
                  <Input
                    value={state.client.email || ""}
                    onChange={(e) => onUpdateClient({ email: e.target.value })}
                    placeholder="purchasing@vessel.com"
                    className="h-10 text-xs rounded-xl border-slate-300 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Phone</Label>
                  <Input
                    value={state.client.phone || ""}
                    onChange={(e) => onUpdateClient({ phone: e.target.value })}
                    placeholder="+91..."
                    className="h-10 text-xs rounded-xl border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section 3: Vessel Details */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOpenVessel((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors"
          >
            <div>
              <p className="font-bold text-sm text-[#172033]">Vessel Details</p>
              <p className="text-xs text-[#64748B]">
                {state.documentInfo.vessel ? state.documentInfo.vessel : "Ship name and port reference"}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                openVessel ? "rotate-180" : ""
              }`}
            />
          </button>

          {openVessel && (
            <div className="p-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/40 animate-in fade-in">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Vessel Name</Label>
                <Input
                  value={state.documentInfo.vessel || ""}
                  onChange={(e) => onUpdateDocInfo({ vessel: e.target.value })}
                  placeholder="e.g. M/V Oceanic Star"
                  className="h-10 text-sm rounded-xl border-slate-300 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">RFQ / Enquiry Ref</Label>
                <Input
                  value={state.documentInfo.reference || ""}
                  onChange={(e) => onUpdateDocInfo({ reference: e.target.value })}
                  placeholder="e.g. RFQ-2026-ENG-09"
                  className="h-10 text-sm rounded-xl border-slate-300 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STICKY BOTTOM ACTION BAR (Exact User Architecture) ── */}
      <footer className="shrink-0 border-t border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs text-[#64748B] block">Total:</span>
            <span className="font-mono font-black text-base sm:text-lg text-[#347A72]">
              {formattedTotal}
            </span>
          </div>

          <Button
            onClick={() => setStage("preview")}
            className="h-12 px-6 rounded-xl font-bold text-sm bg-[#347A72] hover:bg-[#28645E] text-white shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span>Preview Quotation</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
