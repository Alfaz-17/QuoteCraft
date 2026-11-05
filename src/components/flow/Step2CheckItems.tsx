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
  SlidersHorizontal,
  X,
  GripVertical,
  Eye,
  EyeOff
} from "lucide-react";
import { getRoleKey, toNumber } from "@/utils/calculations";

interface Step2CheckItemsProps {
  items: LineItem[];
  tableColumns: TableColumn[];
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onDuplicateItem?: (id: string) => void;
  onReorderItem?: (id: string, direction: "up" | "down") => void;
  onUpdateColumn?: (id: string, updates: Partial<TableColumn>) => void;
  onDeleteColumn?: (id: string) => void;
  onAddColumn?: (col: TableColumn) => void;
  onSetColumns?: (cols: TableColumn[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2CheckItems({
  items,
  tableColumns,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onUpdateColumn,
  onSetColumns,
  onNext,
  onBack,
}: Step2CheckItemsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "review">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";

  // Identify items needing review and specific reason
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

  const handleJumpToNextReview = () => {
    setActiveTab("review");
    if (needsReviewItems.length > 0) {
      setExpandedItemId(needsReviewItems[0].id);
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
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Check Items
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Verify quantities and specifications before pricing
            </p>
          </div>
        </div>

        {/* Quick Toolbar: Layout Settings + Add Item + Next */}
        <div className="flex items-center gap-2">
          {onSetColumns && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowColumnsModal(true)}
              className="h-10 px-3 rounded-lg text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Configure visible columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Table layout</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddItem}
            className="h-10 px-3 rounded-lg text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4 mr-1 text-brand-600" />
            <span>Add row</span>
          </Button>

          <Button
            onClick={onNext}
            className="h-10 px-5 rounded-lg font-bold text-xs sm:text-sm bg-brand-600 hover:bg-brand-700 text-white min-h-[40px] shadow-sm"
          >
            <span>Add prices</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Trust & Review Banner */}
      <div className="rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            reviewCount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}>
            {reviewCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {reviewCount > 0 ? (
                <>We found <span className="font-extrabold">{items.length} items</span>. <span className="text-amber-700 font-extrabold">{reviewCount} need your check.</span></>
              ) : (
                <>All <span className="font-extrabold">{items.length} items</span> look complete and ready to price.</>
              )}
            </p>
            <p className="text-xs text-slate-500">
              Review any highlighted rows to ensure quantities and part numbers are exact.
            </p>
          </div>
        </div>

        {reviewCount > 0 && (
          <Button
            type="button"
            size="sm"
            onClick={handleJumpToNextReview}
            className="h-8 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0"
          >
            Jump to check ({reviewCount})
          </Button>
        )}
      </div>

      {/* Search Bar & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${
              activeTab === "review"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {reviewCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <span className={reviewCount > 0 ? "text-amber-700 font-bold" : ""}>
              Please check ({reviewCount})
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="h-10 pl-9 pr-3 text-xs sm:text-sm rounded-lg border-slate-300 bg-white"
          />
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredItems.map((item, idx) => {
          const reason = getItemReviewReason(item);
          const needsReview = reason !== null;
          const isExpanded = expandedItemId === item.id;
          const qtyVal = toNumber(item[qtyKey]) || 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-3.5 shadow-2xs transition-all ${
                needsReview ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={item.itemName || ""}
                      onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                      placeholder="Item name"
                      className="w-full text-sm font-bold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-brand-600 rounded px-1 -mx-1"
                    />

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.partNumber || "No part no."}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Qty: {qtyVal} {item.unit || "PCS"}
                      </span>
                    </div>

                    {needsReview && (
                      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mt-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{reason}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {needsReview ? (
                    <button
                      type="button"
                      onClick={() => onUpdateItem(item.id, { needsReview: false, isMissingQty: false })}
                      className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 border border-amber-300 text-amber-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-amber-700" />
                      Mark OK
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      OK
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    aria-label={isExpanded ? "Collapse item" : "Expand item"}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mobile Drawer Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Part Number</label>
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="Part No."
                        className="w-full h-9 px-2 rounded-lg border border-slate-300 font-mono text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Quantity & Unit</label>
                      <div className="flex gap-1.5 mt-1">
                        <input
                          type="number"
                          value={typeof item.quantity === "number" ? item.quantity : ""}
                          onChange={(e) => onUpdateItem(item.id, { quantity: Number(e.target.value) || 0, isMissingQty: false })}
                          className="w-20 h-9 px-2 rounded-lg border border-slate-300 font-mono text-xs"
                        />
                        <input
                          type="text"
                          value={item.unit || "PCS"}
                          onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                          className="w-16 h-9 px-1 text-center rounded-lg border border-slate-300 text-xs uppercase font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Technical Specifications</label>
                    <textarea
                      value={(item.technicalSpecification as string) || ""}
                      onChange={(e) => onUpdateItem(item.id, { technicalSpecification: e.target.value })}
                      placeholder="e.g. Bore 500mm, Stroke 2000mm, High-tensile cast iron"
                      rows={2}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 mt-1 resize-none outline-none focus:ring-1 focus:ring-brand-600"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={() => onUpdateItem(item.id, { needsReview: false, isMissingQty: false })}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Confirm item is correct
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 py-1 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[220px]">Item Name & Specifications</th>
                <th className="py-3 px-4 min-w-[130px]">Part / Drawing No.</th>
                <th className="py-3 px-4 w-24 text-right">Quantity</th>
                <th className="py-3 px-4 w-20 text-center">Unit</th>
                <th className="py-3 px-4 w-32 text-center">Status</th>
                <th className="py-3 px-4 w-16 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredItems.map((item, idx) => {
                const reason = getItemReviewReason(item);
                const needsReview = reason !== null;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      needsReview ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={item.itemName || ""}
                        onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                        placeholder="e.g. Cylinder liner"
                        className="w-full font-bold text-sm text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-brand-600 rounded p-1"
                      />
                      {item.description && (
                        <p className="text-xs text-slate-500 pl-1 truncate max-w-md">
                          {item.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="Part No."
                        className="w-full font-mono text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-1 focus:ring-brand-600 rounded p-1"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right">
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
                        className="w-20 text-right font-mono text-sm font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-brand-600 rounded px-1.5 py-1 tabular-nums"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="text"
                        value={item.unit || "PCS"}
                        onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                        className="w-16 text-center text-xs font-bold uppercase text-slate-600 bg-transparent border border-transparent hover:border-slate-300 focus:border-brand-600 rounded py-1"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {needsReview ? (
                        <button
                          type="button"
                          onClick={() => onUpdateItem(item.id, { needsReview: false, isMissingQty: false })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
                          title={reason || "Needs review"}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Check</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>OK</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
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

      {/* Bottom Sticky Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAddItem}
          className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-teal-50 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add another row</span>
        </button>

        <Button
          onClick={onNext}
          className="h-11 px-7 rounded-lg font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white min-h-[44px] shadow-sm"
        >
          <span>Looks good, add prices</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      {/* Advanced Table Layout Modal */}
      {showColumnsModal && onSetColumns && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
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
                        col.visible ? "text-brand-600 hover:bg-teal-50" : "text-slate-400 hover:bg-slate-100"
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
                className="h-10 px-5 rounded-lg font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white"
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
