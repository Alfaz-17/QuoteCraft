"use client";

import React, { useState } from "react";
import { QuotationState, LineItem, TableColumn, Currency } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { EditItemModal } from "./EditItemModal";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle2,
  Minus,
  Check
} from "lucide-react";
import { StepHeader } from "./StepHeader";

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

const COMMON_UNITS = ["PCS", "SETS", "LOT", "KGS", "MTR", "BOX", "DRUM", "PAIR"];

export function Step2CheckItems({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onNext,
}: Step2CheckItemsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "review">("all");
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);

  // Review status calculation
  const getItemReviewReason = (item: LineItem): string | null => {
    if (item.isMissingQty) return "Quantity unclear in RFQ";
    if (!item.quantity || item.quantity <= 0) return "Please check quantity";
    if (!item.itemName || !item.itemName.trim()) return "Missing item description";
    if (item.needsReview) return "Review part specifications";
    return null;
  };

  const isItemNeedsReview = (item: LineItem): boolean => {
    return getItemReviewReason(item) !== null;
  };

  const needsReviewItems = items.filter(isItemNeedsReview);
  const reviewCount = needsReviewItems.length;

  const filteredItems = items.filter((item) => {
    if (filterMode === "review" && !isItemNeedsReview(item)) return false;
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      {/* ── SCROLLABLE LIST ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 max-w-2xl mx-auto w-full space-y-4 pb-24">
        {/* Step Progress & Title */}
        <StepHeader
          step={2}
          title="Review Items"
          subtitle="Make sure AI extraction is correct before generating the quotation."
        />

        {/* Item Count & Trust Status */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#172033]">
              {items.length} {items.length === 1 ? "item" : "items"} extracted
            </span>
            {reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                {reviewCount} need review
              </span>
            ) : items.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                All verified
              </span>
            ) : null}
          </div>
        </div>

        {/* Filter Chips: All & Needs Review */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/70">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                filterMode === "all"
                  ? "bg-white text-[#172033] shadow-xs"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("review")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                filterMode === "review"
                  ? "bg-white text-amber-800 shadow-xs"
                  : "text-amber-700 hover:text-amber-900"
              }`}
            >
              {reviewCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
              <span>Needs Review ({reviewCount})</span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-[#347A72]"
            />
          </div>
        </div>

        {/* Compact Item Cards List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-600">No items match your filter.</p>
              <button
                type="button"
                onClick={() => {
                  setFilterMode("all");
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-[#347A72] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const needsReview = isItemNeedsReview(item);
              const reviewReason = getItemReviewReason(item);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all p-4 space-y-3 shadow-xs ${
                    needsReview
                      ? "border-amber-300 ring-2 ring-amber-400/10"
                      : "border-[#E2E8F0] hover:border-slate-300"
                  }`}
                >
                  {/* Row 1: Item Name (Inline Editable) & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.itemName || ""}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              itemName: e.target.value,
                              needsReview: false,
                            })
                          }
                          placeholder="Product Name or Description"
                          className="w-full font-bold text-base text-[#172033] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#347A72] focus:bg-slate-50/50 rounded px-1 -mx-1 transition-colors focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="shrink-0">
                      {needsReview ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          OK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Part Number */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#64748B] font-semibold">Part No:</span>
                    <input
                      type="text"
                      value={item.partNumber || ""}
                      onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                      placeholder="e.g. MP-102"
                      className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 max-w-[180px] focus:outline-none focus:ring-1 focus:ring-[#347A72]"
                    />
                  </div>

                  {/* Row 3: Quantity Stepper & Unit Dropdown */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#64748B]">Qty:</span>
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(item.quantity) || 1;
                            if (cur > 1) {
                              onUpdateItem(item.id, {
                                quantity: cur - 1,
                                isMissingQty: false,
                              });
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onUpdateItem(item.id, {
                              quantity: val,
                              isMissingQty: false,
                            });
                          }}
                          className="w-12 h-8 text-center font-bold text-sm text-[#172033] focus:outline-none border-x border-slate-200"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(item.quantity) || 1;
                            onUpdateItem(item.id, {
                              quantity: cur + 1,
                              isMissingQty: false,
                            });
                          }}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unit Dropdown */}
                      <select
                        value={item.unit ? item.unit.toUpperCase() : "PCS"}
                        onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                        className="h-8 px-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#347A72]"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Actions: Edit Specs & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Edit specifications"
                        aria-label="Edit item"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Delete item"
                        aria-label="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 4: Specification (if present) */}
                  {(item.description || item.technicalSpecification) && (
                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-[#64748B] font-medium border border-slate-100">
                      <span className="font-semibold text-slate-700">Specification: </span>
                      <span>{item.description || item.technicalSpecification}</span>
                    </div>
                  )}

                  {/* Flagged Item Prompt (Missing info resolution) */}
                  {needsReview && reviewReason && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{reviewReason}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateItem(item.id, {
                            isMissingQty: false,
                            needsReview: false,
                            quantity: item.quantity > 0 ? item.quantity : 1,
                            unit: item.unit || "PCS",
                          })
                        }
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Mark OK</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Secondary Action: + Add Item */}
        <div className="pt-2 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={onAddItem}
            className="w-full h-11 rounded-xl text-xs font-bold border-dashed border-slate-300 text-[#347A72] hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      {/* ── STICKY BOTTOM ACTION BAR (Exact User Architecture) ── */}
      <footer className="shrink-0 border-t border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm font-bold text-[#172033]">
            <span>{items.length} {items.length === 1 ? "Item" : "Items"}</span>
          </div>

          <Button
            onClick={onNext}
            className="h-12 px-6 rounded-xl font-bold text-sm bg-[#347A72] hover:bg-[#28645E] text-white shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </footer>

      {/* Edit Item Specification Modal */}
      <EditItemModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(id, updates) => {
          onUpdateItem(id, updates);
          setEditingItem(null);
        }}
      />
    </div>
  );
}
