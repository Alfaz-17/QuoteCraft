"use client";

import React, { useState } from "react";
import { LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertCircle
} from "lucide-react";
import { getRoleKey, toNumber } from "@/utils/calculations";

interface Step2CheckItemsProps {
  items: LineItem[];
  tableColumns: TableColumn[];
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onDuplicateItem: (id: string) => void;
  onReorderItem: (id: string, direction: "up" | "down") => void;
  onUpdateColumn: (id: string, updates: Partial<TableColumn>) => void;
  onDeleteColumn: (id: string) => void;
  onAddColumn: (col: TableColumn) => void;
  onSetColumns: (cols: TableColumn[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2CheckItems({
  items,
  tableColumns,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onNext,
  onBack,
}: Step2CheckItemsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "review">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";

  // Identify items needing review
  const isItemNeedsReview = (item: LineItem): boolean => {
    if (item.needsReview || item.isMissingQty) return true;
    const qtyVal = toNumber(item[qtyKey]);
    const hasNoQty = !qtyVal || qtyVal <= 0;
    const hasNoName = !item.itemName || !item.itemName.trim();
    return hasNoQty || hasNoName;
  };

  const needsReviewItems = items.filter(isItemNeedsReview);
  const reviewCount = needsReviewItems.length;

  // Filter items by tab and search query
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

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-4 sm:space-y-5 animate-in fade-in duration-300 pb-32">
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
            Review Items
          </h2>
        </div>

        {/* Status Pill (Screen 4 in Mobile Mockup) */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{items.length} items found</span>
        </div>
      </div>

      {/* Search Input Bar (Screen 4 in Mobile Mockup) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="h-10 pl-8 pr-3 text-xs sm:text-sm rounded-xl border-slate-200 bg-white"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
          className="h-10 px-3 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" />
          Add Item
        </Button>
      </div>

      {/* Tabs: All (X) | Needs Review (Y) */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "all"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("review")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "review"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {reviewCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          <span className={reviewCount > 0 ? "text-amber-600" : ""}>
            Needs Review ({reviewCount})
          </span>
        </button>
      </div>

      {/* ── MOBILE-FIRST CARD LIST (Screen 4 in Mobile Mockup: block md:hidden) ── */}
      <div className="block md:hidden space-y-2.5">
        {filteredItems.map((item, idx) => {
          const needsReview = isItemNeedsReview(item);
          const isExpanded = expandedItemId === item.id;
          const qtyVal = toNumber(item[qtyKey]) || 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-3.5 shadow-xs transition-all ${
                needsReview ? "border-amber-200 bg-amber-50/10" : "border-slate-200/90"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Number Badge */}
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={item.itemName || ""}
                      onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                      placeholder="Item Description"
                      className="w-full font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded p-0.5"
                    />

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {item.partNumber ? (
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.partNumber}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No Part No.</span>
                      )}

                      <span className="text-[11px] font-bold text-slate-700 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {qtyVal} {item.unit || "PCS"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Pill on Mobile */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {needsReview ? (
                    <button
                      type="button"
                      onClick={() => onUpdateItem(item.id, { needsReview: false, isMissingQty: false })}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                      Check
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      OK
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Mobile Edit Drawer */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Part Number</label>
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="Part No."
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 font-mono text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity & Unit</label>
                      <div className="flex gap-1 mt-0.5">
                        <input
                          type="number"
                          value={typeof item.quantity === "number" ? item.quantity : ""}
                          onChange={(e) => onUpdateItem(item.id, { quantity: Number(e.target.value) || 0, isMissingQty: false })}
                          className="w-16 h-8 px-2 rounded-lg border border-slate-200 font-mono text-xs"
                        />
                        <input
                          type="text"
                          value={item.unit || "PCS"}
                          onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                          className="w-14 h-8 px-1 text-center rounded-lg border border-slate-200 text-xs uppercase font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Technical Specs</label>
                    <textarea
                      value={(item.technicalSpecification as string) || ""}
                      onChange={(e) => onUpdateItem(item.id, { technicalSpecification: e.target.value })}
                      placeholder="e.g. Bore 500mm, Stroke 2000mm"
                      rows={2}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 mt-0.5 resize-none outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
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

      {/* ── DESKTOP TABLE VIEW (hidden md:block) ── */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Item Description</th>
                <th className="py-3 px-4 min-w-[120px]">Part Number</th>
                <th className="py-3 px-4 w-20 text-center">Qty</th>
                <th className="py-3 px-4 w-20 text-center">Unit</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredItems.map((item, idx) => {
                const needsReview = isItemNeedsReview(item);
                const isExpanded = expandedItemId === item.id;

                return (
                  <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50/70 transition-colors ${needsReview ? "bg-amber-50/20" : ""}`}>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.itemName || ""}
                          onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                          placeholder="e.g. Cylinder liner"
                          className="w-full font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded p-1"
                        />
                        {item.description && (
                          <p className="text-[11px] text-slate-400 pl-1 truncate max-w-md">
                            {item.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.partNumber || ""}
                          onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                          placeholder="Part No."
                          className="w-full font-mono font-semibold text-xs text-slate-700 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded p-1"
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={typeof item.quantity === "number" ? item.quantity : ""}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              quantity: e.target.value === "" ? 0 : Number(e.target.value),
                              isMissingQty: false,
                            })
                          }
                          className={`w-16 mx-auto text-center font-mono font-bold text-xs bg-slate-50 border rounded-lg py-1 px-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 ${
                            needsReview && (!item.quantity || item.quantity <= 0)
                              ? "border-amber-400 bg-amber-50/60 text-amber-900"
                              : "border-slate-200 text-slate-800"
                          }`}
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={item.unit || "PCS"}
                          onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                          className="w-16 mx-auto text-center font-bold text-xs uppercase text-slate-600 bg-slate-50 border border-slate-200 rounded-lg py-1 px-1 focus:bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        {needsReview ? (
                          <button
                            type="button"
                            onClick={() => onUpdateItem(item.id, { needsReview: false, isMissingQty: false })}
                            title="Click to mark verified"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Check</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>OK</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="p-4 pl-12 border-b border-slate-100 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-500 uppercase">
                                Technical Specification
                              </label>
                              <textarea
                                value={(item.technicalSpecification as string) || ""}
                                onChange={(e) => onUpdateItem(item.id, { technicalSpecification: e.target.value })}
                                placeholder="e.g. Bore 500mm, Stroke 2000mm, High-tensile cast iron"
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl mt-1 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-16"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-500 uppercase">
                                Secondary Description / Remarks
                              </label>
                              <textarea
                                value={item.description || ""}
                                onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                                placeholder="Additional remarks or specifications"
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl mt-1 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-16"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attention Banner (Screen 4 in Mobile Mockup: ⚠️ 3 items need attention) */}
      {reviewCount > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-center justify-between text-amber-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{reviewCount} items need attention</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className="text-[11px] underline text-amber-700 hover:text-amber-800"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Sticky Bottom Bar (Screen 4 in Mobile Mockup: Continue ->) */}
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
            className="flex-1 sm:flex-initial h-11 px-8 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 min-h-[44px]"
          >
            Continue to Pricing
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
