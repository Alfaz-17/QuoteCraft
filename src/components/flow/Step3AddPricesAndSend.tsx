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
  Download, 
  MessageCircle, 
  Copy, 
  Check, 
  AlertCircle, 
  FileSpreadsheet, 
  Eye, 
  Trash2, 
  RotateCcw,
  Building,
  Ship,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BellRing,
  Loader2
} from "lucide-react";
import { 
  calculateRowTotal, 
  calculateSubtotal, 
  calculateDiscountAmount, 
  calculateTaxAmount, 
  calculateGrandTotal, 
  getRoleKey, 
  toNumber 
} from "@/utils/calculations";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { MarineTemplate } from "@/components/preview/MarineTemplate";
import { useToast } from "@/components/ui/Toast";
import { DualOrbitalSpinner } from "@/components/ui/Loaders";

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
  onNewQuote,
}: Step3AddPricesAndSendProps) {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Desktop/Mobile View state: "pricing" or "preview"
  const [activeMobileView, setActiveMobileView] = useState<"pricing" | "preview">("pricing");
  const [showLivePreviewOnDesktop, setShowLivePreviewOnDesktop] = useState(true);
  const [showDocMetadata, setShowDocMetadata] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTaxHelp, setShowTaxHelp] = useState(false);

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

  // Unpriced items check (Error prevention)
  const unpricedItems = useMemo(() => {
    return items.filter((item) => {
      const p = toNumber(item[priceKey] ?? item.unitPrice);
      return !p || p <= 0;
    });
  }, [items, priceKey]);

  const formattedTotal = `${currencySymbol} ${grandTotal.toLocaleString(
    currency === "INR" ? "en-IN" : "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )}`;

  // Keyboard navigation like Excel
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

  // Paste whole column of prices from Excel
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    const pasteData = e.clipboardData.getData("text");
    if (!pasteData) return;

    const lines = pasteData
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 1) {
      e.preventDefault();
      const updates: { id: string; price: number }[] = [];

      lines.forEach((line, offset) => {
        const targetIndex = startIndex + offset;
        if (targetIndex < items.length) {
          const cleanNum = parseFloat(line.replace(/,/g, "").replace(/[^0-9.-]/g, ""));
          if (!isNaN(cleanNum)) {
            updates.push({ id: items[targetIndex].id, price: cleanNum });
          }
        }
      });

      if (updates.length > 0) {
        onBatchUpdatePrices(updates);
        toastSuccess(`Pasted ${updates.length} prices from spreadsheet!`);
      }
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (unpricedItems.length > 0) {
      toastInfo(`Note: ${unpricedItems.length} item(s) currently have 0 price.`);
    }

    setIsDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 80));
      await generateProfessionalPDF(state);
      toastSuccess("Branded PDF quotation generated successfully!");
      setShowFollowupModal(true);
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
    toastSuccess("WhatsApp message opened! Attach the downloaded PDF to complete sending.");
    setShowFollowupModal(true);
  };

  const handleCopySummary = () => {
    const quoteNo = state.documentInfo.number || "QUOTATION";
    const clientName = state.client.companyName || state.client.name || "Customer";
    const summary = `Quotation ${quoteNo} for ${clientName}: ${items.length} items, Total: ${formattedTotal}`;
    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    toastSuccess("Quotation summary copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDeleteCurrentQuote = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("marine_quotation_draft");
      localStorage.removeItem("quotation_draft_items");
    }
    toastSuccess("Quotation draft reset.");
    setShowDeleteModal(false);
    onNewQuote();
  };

  return (
    <div className="max-w-7xl mx-auto py-5 sm:py-8 px-3 sm:px-6 space-y-5 animate-in fade-in duration-300 pb-36">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to items
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Add Prices & Send
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Type or paste unit rates from Excel, review the branded PDF, and send
            </p>
          </div>
        </div>

        {/* View toggles & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Segments */}
          <div className="inline-flex sm:hidden p-1 bg-slate-200/80 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveMobileView("pricing")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeMobileView === "pricing"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Add Prices
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileView("preview")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeMobileView === "preview"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              PDF Preview
            </button>
          </div>

          {/* Desktop Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowLivePreviewOnDesktop(!showLivePreviewOnDesktop)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Eye className="w-4 h-4 text-brand-600" />
            <span>{showLivePreviewOnDesktop ? "Hide Live PDF" : "Show Live PDF"}</span>
          </button>

          {/* Customer / Vessel Details Toggle */}
          <button
            type="button"
            onClick={() => setShowDocMetadata(!showDocMetadata)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Building className="w-4 h-4 text-slate-500" />
            <span>{state.client.companyName ? state.client.companyName : "Customer & Vessel"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDocMetadata ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Customer & Vessel Metadata Drawer / Card */}
      {showDocMetadata && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              Quotation Header Details
            </h4>
            <span className="text-xs text-slate-500">Appears on the printed PDF</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Quote / Ref No.</Label>
              <Input
                value={state.documentInfo.number || ""}
                onChange={(e) => onUpdateDocInfo({ number: e.target.value })}
                className="h-9 text-xs sm:text-sm font-mono font-bold rounded-lg border-slate-300"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Customer Company</Label>
              <Input
                value={state.client.companyName || state.client.name || ""}
                onChange={(e) => onUpdateClient({ companyName: e.target.value, name: e.target.value })}
                placeholder="e.g. Oceanic Shipping Co."
                className="h-9 text-xs sm:text-sm font-semibold rounded-lg border-slate-300"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Vessel Name</Label>
              <Input
                value={state.documentInfo.vessel || ""}
                onChange={(e) => onUpdateDocInfo({ vessel: e.target.value })}
                placeholder="e.g. M/V Oceanic Star"
                className="h-9 text-xs sm:text-sm font-semibold rounded-lg border-slate-300"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Currency</Label>
              <select
                value={currency}
                onChange={(e) => onSetCurrency(e.target.value as Currency)}
                className="w-full h-9 px-2 rounded-lg border border-slate-300 font-bold text-xs sm:text-sm bg-white"
              >
                {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c as Currency]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Send Warning if unpriced items exist */}
      {unpricedItems.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-bold">{unpricedItems.length} item(s)</strong> have no price entered yet ($0.00).
            </span>
          </div>
          <span className="text-xs text-amber-800 hidden sm:inline">
            You can still export, or type rates below.
          </span>
        </div>
      )}

      {/* Main Content: Pricing Table & Live Preview */}
      <div className={`grid gap-6 items-start ${showLivePreviewOnDesktop ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
        
        {/* Left Column: Pricing Table (lg:col-span-7 or full) */}
        <div className={`${showLivePreviewOnDesktop ? "lg:col-span-7" : "col-span-1"} ${activeMobileView === "preview" ? "hidden sm:block" : "block"} space-y-4`}>
          
          {/* Excel Paste Tip Banner */}
          <div className="bg-teal-50 border border-teal-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-brand-700">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                <strong>Excel ProTip:</strong> Copy a whole price column from Excel and press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-teal-200">Ctrl+V</kbd> into any unit price box!
              </span>
            </div>
          </div>

          {/* Mobile Pricing Cards (Shown on mobile < md) */}
          <div className="block md:hidden space-y-3">
            {items.map((item, idx) => {
              const qtyVal = toNumber(item[qtyKey]) || 1;
              const priceVal = toNumber(item[priceKey] ?? item.unitPrice);
              const lineTotal = calculateRowTotal(item, tableColumns);
              const isZero = !priceVal || priceVal <= 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-3.5 shadow-2xs space-y-3 transition-all ${
                    isZero ? "border-amber-300 bg-amber-50/10" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.itemName || "Unnamed Item"}
                        </h4>
                        {item.partNumber && (
                          <p className="text-xs font-mono text-slate-500 mt-0.5">
                            Part: {item.partNumber}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          Quantity: <span className="font-bold text-slate-900">{qtyVal} {item.unit || "PCS"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 font-medium block">Total</span>
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {currencySymbol}{lineTotal > 0 ? lineTotal.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Unit Price Input Field */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <label className="text-xs font-bold text-slate-700 shrink-0">
                      Unit Price ({currencySymbol})
                    </label>
                    <div className="relative flex-1 max-w-[170px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold select-none">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={priceVal > 0 ? priceVal : ""}
                        placeholder="0.00"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          onUpdateItem(item.id, {
                            unitPrice: val,
                            [priceKey]: val,
                          });
                        }}
                        className={`w-full pl-6 pr-3 py-2 text-right font-mono text-sm font-bold rounded-lg border transition-all ${
                          isZero
                            ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:border-brand-600 focus:bg-white"
                            : "border-slate-300 text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden on mobile, visible on md+) */}
          <div className="hidden md:block bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                    <th className="py-3 px-3.5 w-10 text-center">#</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Item Description</th>
                    <th className="py-3 px-3 w-20 text-right">Qty</th>
                    <th className="py-3 px-3.5 w-32 text-right">Unit Price ({currencySymbol})</th>
                    <th className="py-3 px-3.5 w-28 text-right">Total ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.map((item, idx) => {
                    const qtyVal = toNumber(item[qtyKey]) || 1;
                    const priceVal = toNumber(item[priceKey] ?? item.unitPrice);
                    const lineTotal = calculateRowTotal(item, tableColumns);
                    const isZero = !priceVal || priceVal <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 text-center font-mono text-xs text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-bold text-slate-900 text-sm truncate max-w-xs">
                            {item.itemName || "Unnamed Item"}
                          </p>
                          {item.partNumber && (
                            <p className="text-xs font-mono text-slate-500 mt-0.5">
                              {item.partNumber}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 font-semibold">
                          {qtyVal} {item.unit || "PCS"}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="relative inline-flex items-center justify-end w-full">
                            <span className="absolute left-2.5 text-xs text-slate-400 font-bold select-none">
                              {currencySymbol}
                            </span>
                            <input
                              ref={(el) => {
                                inputRefs.current[idx] = el;
                              }}
                              type="number"
                              min="0"
                              step="any"
                              value={priceVal > 0 ? priceVal : ""}
                              placeholder="0.00"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                onUpdateItem(item.id, {
                                  unitPrice: val,
                                  [priceKey]: val,
                                });
                              }}
                              onKeyDown={(e) => handleKeyDown(e, idx)}
                              onPaste={(e) => handlePaste(e, idx)}
                              className={`w-28 pl-6 pr-2.5 py-1.5 text-right font-mono text-sm font-bold rounded-lg border transition-all tabular-nums ${
                                isZero
                                  ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:border-brand-600 focus:bg-white"
                                  : "border-slate-300 text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {lineTotal > 0 ? lineTotal.toFixed(2) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Adjustments: Discount, Tax & Delivery */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              Quotation Adjustments
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Discount */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Discount</Label>
                <div className="flex gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={discount || ""}
                    placeholder="0"
                    onChange={(e) => onSetDiscount(parseFloat(e.target.value) || 0, discountType)}
                    className="h-9 text-xs sm:text-sm font-mono font-bold rounded-lg border-slate-300"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => onSetDiscount(discount, e.target.value as "flat" | "percent")}
                    className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="flat">{currencySymbol} Flat</option>
                    <option value="percent">% Off</option>
                  </select>
                </div>
              </div>

              {/* Tax */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-600">Tax (VAT / GST %)</Label>
                  <button
                    type="button"
                    onClick={() => setShowTaxHelp(!showTaxHelp)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={taxPercent || ""}
                  placeholder="0 %"
                  onChange={(e) => onSetTaxPercent(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs sm:text-sm font-mono font-bold rounded-lg border-slate-300"
                />
                {showTaxHelp && (
                  <p className="text-xs text-slate-500 pt-0.5">
                    For marine exports / offshore supply, tax is often 0% (zero-rated).
                  </p>
                )}
              </div>

              {/* Delivery / Freight Charge */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Delivery / Boat Charge</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={shippingCharge || ""}
                  placeholder="0.00"
                  onChange={(e) => onSetShipping(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs sm:text-sm font-mono font-bold rounded-lg border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Branded PDF Preview (lg:col-span-5) */}
        <div className={`${showLivePreviewOnDesktop ? "lg:col-span-5" : "hidden"} ${activeMobileView === "pricing" ? "hidden sm:block" : "block"} space-y-4`}>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-600" />
                <h4 className="text-sm font-bold text-slate-900">Live Quotation Preview</h4>
              </div>
              <span className="text-xs text-slate-500">
                {state.documentInfo.number || "Draft"}
              </span>
            </div>

            {/* Document preview container */}
            <div className="bg-slate-100 rounded-xl p-2 max-h-[560px] overflow-y-auto shadow-inner border border-slate-200/80">
              <div className="scale-[0.85] origin-top bg-white shadow-md rounded">
                <MarineTemplate data={state} />
              </div>
            </div>

            {/* Action Buttons in card */}
            <div className="space-y-2 pt-2">
              <Button
                disabled={isDownloading}
                onClick={handleDownloadPDF}
                className="w-full h-11 rounded-lg font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white min-h-[44px] shadow-sm flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <DualOrbitalSpinner size="sm" className="mr-2" /> Generating Branded PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download PDF Quotation
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleShareWhatsApp}
                  className="h-10 rounded-lg text-xs sm:text-sm font-bold border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Send WhatsApp</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCopySummary}
                  className="h-10 rounded-lg text-xs sm:text-sm font-bold border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copiedLink ? "Copied" : "Copy Summary"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Total & Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 sm:px-8 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Financial Totals Breakdown */}
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="hidden sm:block">
              <span className="text-slate-500">Subtotal:</span>{" "}
              <strong className="font-mono text-slate-800 font-bold">{currencySymbol}{subtotal.toFixed(2)}</strong>
            </div>
            {discountAmt > 0 && (
              <div className="hidden sm:block">
                <span className="text-slate-500">Discount:</span>{" "}
                <strong className="font-mono text-amber-700 font-bold">-{currencySymbol}{discountAmt.toFixed(2)}</strong>
              </div>
            )}
            {taxAmt > 0 && (
              <div className="hidden sm:block">
                <span className="text-slate-500">Tax:</span>{" "}
                <strong className="font-mono text-slate-800 font-bold">+{currencySymbol}{taxAmt.toFixed(2)}</strong>
              </div>
            )}
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-slate-500 font-bold">Grand Total:</span>{" "}
              <span className="font-mono text-base sm:text-lg font-extrabold text-brand-600 ml-2">
                {formattedTotal}
              </span>
            </div>
          </div>

          {/* Right: Primary Download & Share Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="h-10 px-3 rounded-lg text-xs font-semibold text-rose-600 border-slate-200 hover:bg-rose-50"
              title="Delete draft"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={handleShareWhatsApp}
              className="h-10 px-4 rounded-lg font-bold text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            <Button
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="h-10 px-6 rounded-lg font-bold text-xs sm:text-sm bg-brand-600 hover:bg-brand-700 text-white min-h-[40px] flex-1 sm:flex-initial shadow-sm flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <DualOrbitalSpinner size="sm" className="mr-2" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>

      {/* Retention / Follow-up Reminder Modal */}
      {showFollowupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 sm:p-7 max-w-sm w-full text-center space-y-4 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Quotation {state.documentInfo.number ? state.documentInfo.number : ""} Ready!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Your quotation has been generated and saved securely.
              </p>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-brand-700 font-semibold flex items-center gap-2 text-left">
              <BellRing className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Would you like QuoteCraft to remind you to follow up on this quote in 3 days?</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowFollowupModal(false)}
                className="flex-1 h-10 rounded-lg text-xs font-semibold border-slate-300"
              >
                Skip for now
              </Button>
              <Button
                onClick={() => {
                  toastSuccess("Follow-up reminder set for 3 days!");
                  setShowFollowupModal(false);
                }}
                className="flex-1 h-10 rounded-lg font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white"
              >
                Remind in 3 days
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Reset quotation draft?</h3>
              <p className="text-xs text-slate-500">
                This will clear current items. Your company profile and saved quotes remain safe.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-10 rounded-lg text-xs font-semibold border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCurrentQuote}
                className="flex-1 h-10 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Reset Draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

