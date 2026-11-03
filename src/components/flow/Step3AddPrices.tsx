"use client";

import React, { useRef } from "react";
import { LineItem, TableColumn, Currency, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowRight, ArrowLeft, DollarSign, Sparkles, Percent, Tag, 
  HelpCircle, Check 
} from "lucide-react";
import { calculateRowTotal, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal, getRoleKey, toNumber } from "@/utils/calculations";
import { useToast } from "@/components/ui/Toast";

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "INR", label: "₹ INR" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "AED", label: "AED" },
  { value: "SGD", label: "S$ SGD" },
  { value: "GBP", label: "£ GBP" },
  { value: "JPY", label: "¥ JPY" },
];

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
  onSetCurrency,
  onSetDiscount,
  onSetTaxPercent,
  onSetShipping,
  onNext,
  onBack,
}: Step3AddPricesProps) {
  const { success: toastSuccess } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || "₹";
  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";
  const priceKey = getRoleKey(tableColumns, "price") ?? "unitPrice";

  // Financial calculations
  const subtotal = calculateSubtotal(items, tableColumns);
  const discountAmt = calculateDiscountAmount(subtotal, discount, discountType);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = calculateTaxAmount(afterDiscount, taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, discount, discountType, taxPercent, shippingCharge);

  // Keyboard navigation: Enter / Down arrow moves to next row price cell!
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

  // Paste a whole column from Excel (Principle 2)
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

  const formatMoney = (val: number): string => {
    return val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 animate-in fade-in duration-300 pb-32">
      {/* Native Control Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Add Item Prices
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {items.length} items
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Use <kbd className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold border">Enter</kbd> to move down. You can copy a column in Excel and paste it into any price cell.
          </p>
        </div>

        {/* Currency & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100/90 rounded-xl px-2.5 py-1 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500">Currency:</span>
            <Select value={currency} onValueChange={(v) => onSetCurrency(v as Currency)}>
              <SelectTrigger className="h-7 text-xs font-bold border-none bg-transparent shadow-none w-24 p-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs font-semibold">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onNext}
            className="h-10 px-5 rounded-xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-[0.98]"
          >
            Review Quote <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* DESKTOP SPREADSHEET (Airtable / Excel Native Ergonomics) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="max-h-[58vh] overflow-y-auto relative">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[260px]">Item Description</th>
                <th className="py-2.5 px-3 w-36">Part Number</th>
                <th className="py-2.5 px-3 w-24 text-right">Qty</th>
                <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                <th className="py-2.5 px-3 w-36 text-right bg-primary/5 text-primary">
                  Rate ({currencySymbol})
                </th>
                <th className="py-2.5 px-4 w-36 text-right">Total ({currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.map((item, index) => {
                const qtyVal = toNumber(item[qtyKey]);
                const rowTotal = calculateRowTotal(item, tableColumns);
                const hasZeroPrice = !toNumber(item[priceKey]);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      hasZeroPrice ? "bg-amber-50/15" : ""
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center font-mono font-semibold text-slate-400 text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* Item Name */}
                    <td className="py-2 px-3">
                      <p className="font-semibold text-slate-900 text-sm truncate max-w-md">
                        {item.itemName || <span className="text-slate-400 italic font-normal">Unnamed Item</span>}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{item.description}</p>
                      )}
                    </td>

                    {/* Part Number */}
                    <td className="py-2 px-3 font-mono text-xs text-slate-600">
                      {item.partNumber ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.partNumber}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      {qtyVal || 0}
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-3 text-center uppercase text-xs font-semibold text-slate-500">
                      {item.unit || "PCS"}
                    </td>

                    {/* Unit Price (Spreadsheet cell) */}
                    <td className="py-1 px-2 text-right bg-primary/5">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                          {currencySymbol}
                        </span>
                        <input
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="number"
                          step="any"
                          min="0"
                          value={item[priceKey] !== undefined && item[priceKey] !== null ? item[priceKey] : ""}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              [priceKey]: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                            })
                          }
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onPaste={(e) => handlePaste(e, index)}
                          placeholder="0.00"
                          className="w-full h-8 pl-6 pr-2 text-right font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </td>

                    {/* Row Total */}
                    <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {currencySymbol}{formatMoney(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE COMPACT CARDS */}
      <div className="block md:hidden space-y-2.5">
        {items.map((item, index) => {
          const qtyVal = toNumber(item[qtyKey]);
          const rowTotal = calculateRowTotal(item, tableColumns);

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      #{index + 1}
                    </span>
                    <h5 className="font-bold text-sm text-slate-900 truncate">
                      {item.itemName || "Unnamed Item"}
                    </h5>
                  </div>
                  {item.partNumber && (
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      Part: {item.partNumber}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {qtyVal} {item.unit || "pcs"}
                  </span>
                </div>
              </div>

              {/* Price Entry on Mobile */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item[priceKey] || ""}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          [priceKey]: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full h-11 pl-7 pr-3 text-right font-mono font-bold text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="font-mono font-bold text-base text-primary mt-0.5">
                    {currencySymbol}{formatMoney(rowTotal)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PRINCIPLE 5: FLOATING NATIVE FINANCIAL DOCK (Pinned to viewport bottom) */}
      <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-7xl mx-auto z-40">
        <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick tax and discount chips */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 font-bold">Tax:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercent || ""}
                  onChange={(e) => onSetTaxPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-12 h-6 text-right font-bold bg-slate-700 text-white rounded border-none px-1 outline-none"
                />
                <span className="text-slate-400 font-bold">%</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 font-bold">Discount:</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ""}
                  onChange={(e) => onSetDiscount(parseFloat(e.target.value) || 0, discountType)}
                  placeholder="0"
                  className="w-16 h-6 text-right font-bold bg-slate-700 text-white rounded border-none px-1 outline-none"
                />
                <button
                  onClick={() => onSetDiscount(discount, discountType === "percent" ? "flat" : "percent")}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 ml-0.5 underline"
                >
                  {discountType === "percent" ? "%" : currencySymbol}
                </button>
              </div>

              <div className="text-slate-400 text-xs font-medium hidden sm:inline ml-1">
                Subtotal: <span className="font-mono text-white font-bold">{currencySymbol}{formatMoney(subtotal)}</span>
              </div>
            </div>

            {/* Big Numbers, Right-Aligned */}
            <div className="flex items-center justify-between lg:justify-end gap-5">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Grand Total
                </p>
                <h4 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
                  {currencySymbol} {formatMoney(grandTotal)}
                </h4>
              </div>

              <Button
                onClick={onNext}
                className="h-11 px-6 sm:px-8 rounded-2xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 min-h-[44px] active:scale-[0.98]"
              >
                Next: Send quote <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
