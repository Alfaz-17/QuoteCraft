"use client";

import React, { useRef, useState } from "react";
import { LineItem, TableColumn, Currency, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Plus, 
  X,
  Ship,
  FileText
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
import { useToast } from "@/components/ui/Toast";

interface Step3AddPricesProps {
  items: LineItem[];
  tableColumns: TableColumn[];
  currency: Currency;
  discount: number;
  discountType: "flat" | "percent";
  taxPercent: number;
  shippingCharge: number;
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void;
  onBatchUpdatePrices: (updates: { id: string; price: number }[]) => void;
  onSetCurrency: (curr: Currency) => void;
  onSetDiscount: (amount: number, type: "flat" | "percent") => void;
  onSetTaxPercent: (tax: number) => void;
  onSetShipping: (shipping: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3AddPrices({
  items,
  tableColumns,
  currency,
  discount,
  discountType,
  taxPercent,
  shippingCharge,
  onUpdateItem,
  onBatchUpdatePrices,
  onSetDiscount,
  onSetTaxPercent,
  onNext,
  onBack,
}: Step3AddPricesProps) {
  const { success: toastSuccess } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showDiscountInput, setShowDiscountInput] = useState(discount > 0);
  const [showTaxInput, setShowTaxInput] = useState(taxPercent > 0);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || "$";
  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";
  const priceKey = getRoleKey(tableColumns, "price") ?? "unitPrice";

  // Financial calculations
  const subtotal = calculateSubtotal(items, tableColumns);
  const discountAmt = calculateDiscountAmount(subtotal, discount, discountType);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = calculateTaxAmount(afterDiscount, taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, discount, discountType, taxPercent, shippingCharge);

  // Keyboard navigation for desktop table
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

  // Paste whole column from Excel
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    const pasteData = e.clipboardData.getData("text");
    if (!pasteData) return;

    const lines = pasteData
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length > 1) {
      e.preventDefault();
      const updates: { id: string; price: number }[] = [];

      lines.forEach((line, offset) => {
        const targetIndex = startIndex + offset;
        if (targetIndex < items.length) {
          const cleanNum = toNumber(line);
          updates.push({
            id: items[targetIndex].id,
            price: cleanNum,
          });
        }
      });

      if (updates.length > 0) {
        onBatchUpdatePrices(updates);
        toastSuccess(`Pasted ${updates.length} prices directly from Excel!`);
      }
    }
  };

  const handleSaveDraft = () => {
    toastSuccess("Quotation draft saved successfully!");
  };

  const formatMoney = (val: number): string => {
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-32">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Quotation Builder
          </h2>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          className="h-9 px-3 rounded-xl text-xs font-bold border-[#0F766E]/40 text-[#0F766E] hover:bg-[#E0F2F1]"
        >
          <Save className="w-3.5 h-3.5 mr-1" /> Save Draft
        </Button>
      </div>

      {/* ── MOBILE DOCUMENT HEADER & PRICING SUMMARY (Screen 5 in Mobile Mockup) ── */}
      <div className="block md:hidden space-y-3">
        {/* Document Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0">
              <Ship className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                AURA MARINE SOLUTIONS
              </h3>
              <p className="text-[11px] font-mono font-bold text-[#0F766E] mt-0.5">
                QT-1075
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Valid 30 Days</span>
        </div>

        {/* Pricing Summary Card (Screen 5 in Mobile Mockup) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Pricing Summary
          </h4>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-800">
                {currencySymbol}{formatMoney(subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span className="font-mono font-bold text-slate-800">
                -{currencySymbol}{formatMoney(discountAmt)}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Tax (VAT)</span>
              <span className="font-mono font-bold text-slate-800">
                {currencySymbol}{formatMoney(taxAmt)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
              <span className="font-black text-slate-900">Grand Total</span>
              <span className="font-mono font-black text-base text-[#0F766E]">
                {currencySymbol}{formatMoney(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Items Pricing Cards */}
        <div className="space-y-2.5 pt-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Line Items ({items.length})
          </h4>

          {items.map((item, index) => {
            const qtyVal = toNumber(item[qtyKey]) || 0;
            const rowTotal = calculateRowTotal(item, tableColumns);
            const currentPrice = typeof item[priceKey] === "number" ? item[priceKey] : "";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.itemName || "Unnamed Item"}
                      </h5>
                    </div>
                    {item.partNumber && (
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Part: {item.partNumber}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                    {qtyVal} {item.unit || "PCS"}
                  </span>
                </div>

                {/* Price input & row total */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Unit Price ({currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={currentPrice}
                        onChange={(e) =>
                          onUpdateItem(item.id, {
                            [priceKey]: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        className="w-full h-10 pl-7 pr-2.5 text-right font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0F766E] outline-none"
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0 min-w-[90px]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Total ({currency})
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 block leading-10">
                      {currencySymbol}{formatMoney(rowTotal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP SPREADSHEET TABLE (hidden md:block) ── */}
      <div className="hidden md:block space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[240px]">Item Description</th>
                  <th className="py-3 px-4 w-20 text-center">Qty</th>
                  <th className="py-3 px-4 w-20 text-center">Unit</th>
                  <th className="py-3 px-4 w-40 text-right">Unit Price ({currency})</th>
                  <th className="py-3 px-4 w-36 text-right">Total ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((item, index) => {
                  const qtyVal = toNumber(item[qtyKey]) || 0;
                  const rowTotal = calculateRowTotal(item, tableColumns);
                  const currentPrice = typeof item[priceKey] === "number" ? item[priceKey] : "";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          {item.itemName || "Unnamed Item"}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.partNumber && (
                            <span className="text-[11px] font-mono text-slate-500">
                              Part: {item.partNumber}
                            </span>
                          )}
                          {item.technicalSpecification && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs">
                              • {item.technicalSpecification}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-xs font-mono text-slate-700">
                        {qtyVal}
                      </td>

                      <td className="py-3 px-4 text-center font-semibold text-xs text-slate-500 uppercase">
                        {item.unit || "PCS"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="relative inline-flex items-center w-36">
                          <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none">
                            {currencySymbol}
                          </span>
                          <input
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="number"
                            step="any"
                            min="0"
                            value={currentPrice}
                            onChange={(e) =>
                              onUpdateItem(item.id, {
                                [priceKey]: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                              })
                            }
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={(e) => handlePaste(e, index)}
                            placeholder="0"
                            className="w-full h-9 pl-7 pr-3 text-right font-mono font-bold text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none transition-all"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-xs sm:text-sm text-slate-900">
                        {currencySymbol}{formatMoney(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desktop Totals Box */}
        <div className="flex items-start justify-between gap-6 pt-2">
          <div className="space-y-3">
            {!showDiscountInput ? (
              <button
                type="button"
                onClick={() => setShowDiscountInput(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:text-[#0D6B63] hover:underline py-1.5 px-2.5 rounded-lg hover:bg-[#E0F2F1] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Discount
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2 max-w-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Discount</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscountInput(false);
                      onSetDiscount(0, "flat");
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discount || ""}
                    onChange={(e) => onSetDiscount(parseFloat(e.target.value) || 0, discountType)}
                    placeholder="0"
                    className="w-24 h-8 px-2 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onSetDiscount(discount, discountType === "percent" ? "flat" : "percent")}
                    className="h-8 px-2.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200"
                  >
                    {discountType === "percent" ? "%" : currencySymbol}
                  </button>
                </div>
              </div>
            )}

            {!showTaxInput ? (
              <button
                type="button"
                onClick={() => setShowTaxInput(true)}
                className="block text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline py-1 px-2.5"
              >
                + Add Tax / VAT
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2 max-w-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Tax / VAT (%)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaxInput(false);
                      onSetTaxPercent(0);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent || ""}
                    onChange={(e) => onSetTaxPercent(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 h-8 px-2 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-80 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-800">
                {currencySymbol}{formatMoney(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Discount</span>
              <span className="font-mono font-bold text-slate-800">
                -{currencySymbol}{formatMoney(discountAmt)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Tax ({taxPercent}%)</span>
              <span className="font-mono font-bold text-slate-800">
                {currencySymbol}{formatMoney(taxAmt)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-slate-900">Grand Total</span>
              <span className="text-lg sm:text-xl font-black font-mono text-[#0F766E]">
                {currencySymbol}{formatMoney(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Screen 5 in Mobile Mockup: Generate Quotation) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-11 px-4 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>

          <Button
            onClick={onNext}
            className="flex-1 sm:flex-initial h-11 px-8 rounded-xl font-bold text-xs sm:text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-md shadow-[#0F766E]/20 min-h-[44px]"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Generate Quotation
          </Button>
        </div>
      </div>
    </div>
  );
}
