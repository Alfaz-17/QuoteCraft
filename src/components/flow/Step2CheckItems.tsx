"use client";

import React, { useState, useRef } from "react";
import { QuotationState, LineItem, TableColumn, Currency, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Check, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  X,
  RotateCcw,
  Building,
  HelpCircle,
  FileSpreadsheet,
  Eye,
  EyeOff
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

interface Step2CheckItemsProps {
  state?: QuotationState;
  items: LineItem[];
  tableColumns: TableColumn[];
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void;
  onBatchUpdatePrices?: (updates: { id: string; price: number }[]) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onDuplicateItem?: (id: string) => void;
  onReorderItem?: (id: string, direction: "up" | "down") => void;
  onSetCurrency?: (curr: Currency) => void;
  onSetDiscount?: (amount: number, type: "flat" | "percent") => void;
  onSetTaxPercent?: (tax: number) => void;
  onSetShipping?: (shipping: number) => void;
  onUpdateClient?: (client: Partial<QuotationState["client"]>) => void;
  onUpdateDocInfo?: (docInfo: Partial<QuotationState["documentInfo"]>) => void;
  onUpdateColumn?: (id: string, updates: Partial<TableColumn>) => void;
  onDeleteColumn?: (id: string) => void;
  onAddColumn?: (col: TableColumn) => void;
  onSetColumns?: (cols: TableColumn[]) => void;
  onClearExtraction: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2CheckItems({
  state,
  items,
  tableColumns,
  onUpdateItem,
  onBatchUpdatePrices,
  onDeleteItem,
  onAddItem,
  onSetCurrency,
  onSetDiscount,
  onSetTaxPercent,
  onSetShipping,
  onUpdateClient,
  onUpdateDocInfo,
  onUpdateColumn,
  onSetColumns,
  onClearExtraction,
  onNext,
  onBack,
}: Step2CheckItemsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "review">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDocMetadata, setShowDocMetadata] = useState(false);
  const [showTaxHelp, setShowTaxHelp] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";
  const priceKey = getRoleKey(tableColumns, "price") ?? "unitPrice";

  // Financial calculations
  const currency = state?.currency || "USD";
  const currencySymbol = CURRENCY_SYMBOLS[currency] || "$";
  const discount = state?.discount || 0;
  const discountType = state?.discountType || "flat";
  const taxPercent = state?.taxPercent || 0;
  const shippingCharge = state?.shippingCharge || 0;

  const subtotal = calculateSubtotal(items, tableColumns);
  const discountAmt = calculateDiscountAmount(subtotal, discount, discountType);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxAmt = calculateTaxAmount(afterDiscount, taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, discount, discountType, taxPercent, shippingCharge);
  const formattedTotal = `${currencySymbol} ${grandTotal.toLocaleString(
    currency === "INR" ? "en-IN" : "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )}`;

  // Identify items needing review
  const getItemReviewReason = (item: LineItem): string | null => {
    if (item.isMissingQty) return "Quantity unclear in RFQ";
    const qtyVal = toNumber(item[qtyKey]);
    if (!qtyVal || qtyVal <= 0) return "Please check quantity";
    if (!item.itemName || !item.itemName.trim()) return "Missing item name";
    if (item.needsReview) return "Review part specifications";
    return null;
  };

  const isItemNeedsReview = (item: LineItem): boolean => {
    return getItemReviewReason(item) !== null;
  };

  const needsReviewItems = items.filter(isItemNeedsReview);
  const reviewCount = needsReviewItems.length;

  // Filter items by search and active tab
  const filteredItems = items.filter((item) => {
    if (activeTab === "review" && !isItemNeedsReview(item)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.itemName || "").toLowerCase().includes(q);
      const matchPart = (item.partNumber || "").toLowerCase().includes(q);
      const matchDesc = (item.description || "").toLowerCase().includes(q);
      return matchName || matchPart || matchDesc;
    }
    return true;
  });

  const handleJumpToNextReview = () => {
    setActiveTab("review");
    if (needsReviewItems.length > 0) {
      setExpandedItemId(needsReviewItems[0].id);
    }
  };

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

      if (updates.length > 0 && onBatchUpdatePrices) {
        onBatchUpdatePrices(updates);
      }
    }
  };

  const handleToggleColumnVisibility = (id: string, currentVisible: boolean) => {
    if (onUpdateColumn) {
      onUpdateColumn(id, { visible: !currentVisible });
    }
  };

  const handleMoveColumn = (index: number, direction: -1 | 1) => {
    if (!onSetColumns) return;
    const target = index + direction;
    if (target < 0 || target >= tableColumns.length) return;
    const next = [...tableColumns];
    [next[index], next[target]] = [next[target], next[index]];
    onSetColumns(next);
  };

  return (
    <div className="max-w-6xl mx-auto py-5 sm:py-8 px-3 sm:px-6 space-y-5 animate-in fade-in duration-300 pb-36">
      {/* ── TOP HEADER & PRIMARY ACTION TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors min-h-[38px]"
            title="Return to Request"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Upload RFQ</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Items &amp; Pricing
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 text-[#0F766E] border border-teal-200">
                {items.length} items
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
              Edit item specifications, enter unit prices (supports Excel paste), and review totals
            </p>
          </div>
        </div>

        {/* Actions: Clear Extraction + Add Row + Next */}
        <div className="flex items-center gap-2">
          {/* Discard / Re-upload button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowClearModal(true)}
            className="h-10 px-3 rounded-lg text-xs font-semibold border-rose-200 text-rose-700 hover:bg-rose-50"
            title="Clear items and re-upload a different RFQ"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
            <span className="hidden sm:inline">Clear &amp; Re-upload</span>
            <span className="sm:hidden">Reset</span>
          </Button>

          {/* Table Layout */}
          {onSetColumns && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowColumnsModal(true)}
              className="h-10 px-3 rounded-lg text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 hidden sm:flex items-center"
              title="Configure visible table columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Columns</span>
            </Button>
          )}

          {/* Add Row */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddItem}
            className="h-10 px-3 rounded-lg text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4 mr-1 text-[#0F766E]" />
            <span>Add Row</span>
          </Button>

          {/* Next Button: Takes directly to Preview & Send */}
          <Button
            onClick={onNext}
            className="h-10 px-5 rounded-lg font-bold text-xs sm:text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white min-h-[40px] shadow-sm flex items-center gap-1.5"
          >
            <span>Preview &amp; Send</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── CLEAN STATUS INDICATOR (NO WALL-OF-TEXT BANNER) ── */}
      {reviewCount > 0 ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {reviewCount} item{reviewCount > 1 ? "s" : ""} need attention (e.g. quantity or specification).
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleJumpToNextReview}
            className="h-8 px-3 rounded-md text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0"
          >
            Jump to check ({reviewCount})
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All {items.length} items verified and ready for commercial pricing.</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
            {items.length} items
          </span>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {reviewCount > 0 ? (
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All items ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("review")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "review"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-700 font-bold">Needs Check ({reviewCount})</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>Excel Tip:</strong> You can paste an entire column of prices directly into any Unit Price box.
            </span>
          </div>
        )}

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or part numbers..."
            className="h-10 pl-9 pr-3 text-xs sm:text-sm rounded-lg border-slate-300 bg-white"
          />
        </div>
      </div>

      {/* ── MOBILE TOUCH CARDS (< md) ── */}
      <div className="block md:hidden space-y-3">
        {filteredItems.map((item, idx) => {
          const reason = getItemReviewReason(item);
          const needsReview = reason !== null;
          const isExpanded = expandedItemId === item.id;
          const qtyVal = toNumber(item[qtyKey]) || 1;
          const priceVal = toNumber(item[priceKey] ?? item.unitPrice);
          const lineTotal = calculateRowTotal(item, tableColumns);
          const isZero = !priceVal || priceVal <= 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg border p-3.5 shadow-2xs space-y-3 transition-all ${
                needsReview
                  ? "border-amber-300 bg-amber-50/20"
                  : isZero
                  ? "border-amber-200 bg-amber-50/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      type="text"
                      value={item.itemName || ""}
                      onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                      placeholder="Item name"
                      className="w-full text-sm font-bold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal-600 rounded px-1 -mx-1"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="Part No."
                        className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 max-w-[130px]"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Qty: {qtyVal} {item.unit || "PCS"}
                      </span>
                    </div>

                    {needsReview && (
                      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{reason}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs text-slate-400 font-medium">Total</span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {currencySymbol}{lineTotal > 0 ? lineTotal.toFixed(2) : "0.00"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                    aria-label="Expand details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Price input on mobile */}
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
                        ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:border-teal-600 focus:bg-white"
                        : "border-slate-300 text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Mobile Controls */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Quantity</label>
                      <input
                        type="number"
                        value={typeof item.quantity === "number" ? item.quantity : ""}
                        onChange={(e) => onUpdateItem(item.id, { quantity: Number(e.target.value) || 0, isMissingQty: false })}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 font-mono text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Unit</label>
                      <input
                        type="text"
                        value={item.unit || "PCS"}
                        onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP UNIFIED SPREADSHEET TABLE (md+) ── */}
      <div className="hidden md:block bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-3.5 w-10 text-center">#</th>
                <th className="py-3 px-3.5 min-w-[220px]">Item Description</th>
                <th className="py-3 px-3 min-w-[120px]">Part / Drawing No.</th>
                <th className="py-3 px-3 w-20 text-right">Qty</th>
                <th className="py-3 px-3 w-16 text-center">Unit</th>
                <th className="py-3 px-3.5 w-32 text-right">Unit Price ({currencySymbol})</th>
                <th className="py-3 px-3.5 w-28 text-right">Total ({currencySymbol})</th>
                <th className="py-3 px-3 w-12 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredItems.map((item, idx) => {
                const reason = getItemReviewReason(item);
                const needsReview = reason !== null;
                const qtyVal = toNumber(item[qtyKey]) || 1;
                const priceVal = toNumber(item[priceKey] ?? item.unitPrice);
                const lineTotal = calculateRowTotal(item, tableColumns);
                const isZero = !priceVal || priceVal <= 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      needsReview ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <td className="py-3 px-3.5 text-center font-mono text-xs font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3.5">
                      <input
                        type="text"
                        value={item.itemName || ""}
                        onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                        placeholder="Item name"
                        className="w-full font-bold text-sm text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-teal-600 rounded p-1"
                      />
                      {needsReview && (
                        <p className="text-xs text-amber-700 font-semibold pl-1 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{reason}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="Part No."
                        className="w-full font-mono text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-1 focus:ring-teal-600 rounded p-1"
                      />
                    </td>

                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={typeof item.quantity === "number" ? item.quantity : ""}
                        onChange={(e) =>
                          onUpdateItem(item.id, {
                            quantity: Number(e.target.value) || 0,
                            isMissingQty: false,
                          })
                        }
                        className="w-16 text-right font-mono text-sm font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-teal-600 rounded px-1.5 py-1 tabular-nums"
                      />
                    </td>

                    <td className="py-3 px-3 text-center">
                      <input
                        type="text"
                        value={item.unit || "PCS"}
                        onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                        className="w-14 text-center text-xs font-bold uppercase text-slate-600 bg-transparent border border-transparent hover:border-slate-300 focus:border-teal-600 rounded py-1"
                      />
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
                              ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:border-teal-600 focus:bg-white"
                              : "border-slate-300 text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                          }`}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono text-sm font-bold text-slate-900 tabular-nums">
                      {lineTotal > 0 ? lineTotal.toFixed(2) : "-"}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        title="Delete line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── QUOTATION ADJUSTMENTS: CURRENCY, DISCOUNT, TAX & SHIPPING ── */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
            Quotation Currency &amp; Adjustments
          </h4>
          {onUpdateClient && (
            <button
              type="button"
              onClick={() => setShowDocMetadata(!showDocMetadata)}
              className="text-xs text-[#0F766E] font-bold hover:underline flex items-center gap-1"
            >
              <Building className="w-3.5 h-3.5" />
              <span>{showDocMetadata ? "Hide Header Details" : "Customer & Vessel Details"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDocMetadata ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Customer & Vessel Drawer */}
        {showDocMetadata && onUpdateClient && onUpdateDocInfo && state && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 pb-3 border-b border-slate-100 text-xs animate-in fade-in duration-150">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Quotation No.</Label>
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
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Currency */}
          {onSetCurrency && (
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
          )}

          {/* Discount */}
          {onSetDiscount && (
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
          )}

          {/* Tax */}
          {onSetTaxPercent && (
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
            </div>
          )}

          {/* Shipping / Delivery */}
          {onSetShipping && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">Launch / Shipping Charge</Label>
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
          )}
        </div>
      </div>

      {/* ── STICKY BOTTOM TOTAL & NEXT ACTION BAR ── */}
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
              <span className="font-mono text-base sm:text-lg font-extrabold text-[#0F766E] ml-2">
                {formattedTotal}
              </span>
            </div>
          </div>

          {/* Right: Next Step Primary Action */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onAddItem}
              className="h-10 px-3.5 rounded-lg font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4 mr-1 text-[#0F766E]" />
              <span>Add Row</span>
            </Button>

            <Button
              onClick={onNext}
              className="h-10 px-6 rounded-lg font-bold text-xs sm:text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white min-h-[40px] flex-1 sm:flex-initial shadow-sm flex items-center justify-center gap-2"
            >
              <span>Preview &amp; Send Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>

      {/* ── CONFIRMATION MODAL: CLEAR / RE-UPLOAD EXTRACTION ── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Clear extracted items?</h3>
              <p className="text-xs text-slate-500">
                This will discard the {items.length} items from this draft and let you upload a different RFQ file or start fresh.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowClearModal(false)}
                className="flex-1 h-10 rounded-lg text-xs font-semibold border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowClearModal(false);
                  onClearExtraction();
                }}
                className="flex-1 h-10 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Clear &amp; Re-upload
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLE COLUMNS MODAL ── */}
      {showColumnsModal && onSetColumns && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Table Columns Layout</h3>
                <p className="text-xs text-slate-500">Show or hide columns on your customer quotation</p>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnsModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tableColumns.map((col, index) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{col.label}</span>
                    {col.role && (
                      <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {col.role}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleColumnVisibility(col.id, col.visible)}
                      className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                        col.visible ? "text-[#0F766E] hover:bg-teal-50" : "text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span>{col.visible ? "Visible" : "Hidden"}</span>
                    </button>

                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveColumn(index, -1)}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === tableColumns.length - 1}
                        onClick={() => handleMoveColumn(index, 1)}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowColumnsModal(false)}
                className="h-10 px-5 rounded-lg font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
