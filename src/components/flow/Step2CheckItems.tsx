"use client";

import React, { useState, useMemo } from "react";
import { QuotationState, LineItem, TableColumn, Currency } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { EditItemModal } from "./EditItemModal";
import { StepHeader } from "./StepHeader";
import { categorize, CATEGORY_META, ItemCategory } from "@/lib/itemCategory";
import { 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle2,
  Minus,
  Check,
  RotateCw,
  SlidersHorizontal,
  Disc,
  Filter,
  CircleDot,
  Compass,
  Gauge,
  Activity,
  Zap,
  ShieldCheck,
  FlaskConical,
  Package,
  LayoutList,
  LayoutGrid,
  X,
  ChevronRight,
  Sparkles
} from "lucide-react";

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

/** Category Icon Renderer */
function CategoryIcon({ category }: { category: ItemCategory }) {
  const size = "w-4 h-4";
  switch (category) {
    case "pump": return <RotateCw className={size} />;
    case "valve": return <SlidersHorizontal className={size} />;
    case "flange": return <Disc className={size} />;
    case "filter": return <Filter className={size} />;
    case "gasket": return <CircleDot className={size} />;
    case "bearing": return <Compass className={size} />;
    case "gauge": return <Gauge className={size} />;
    case "hose": return <Activity className={size} />;
    case "electrical": return <Zap className={size} />;
    case "safety": return <ShieldCheck className={size} />;
    case "chemical": return <FlaskConical className={size} />;
    default: return <Package className={size} />;
  }
}

export function Step2CheckItems({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onNext,
  onBack,
}: Step2CheckItemsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "review" | "verified">("all");
  const [viewMode, setViewMode] = useState<"compact" | "cards">("compact");
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Review status calculation
  const getItemReviewReason = (item: LineItem): string | null => {
    if (item.isMissingQty) return "Quantity unclear in RFQ";
    if (!item.quantity || Number(item.quantity) <= 0) return "Please check quantity";
    if (!item.itemName || !item.itemName.trim()) return "Missing item description";
    if (item.needsReview) return "Review part specifications";
    return null;
  };

  const isItemNeedsReview = (item: LineItem): boolean => {
    return getItemReviewReason(item) !== null;
  };

  const needsReviewItems = useMemo(() => items.filter(isItemNeedsReview), [items]);
  const reviewCount = needsReviewItems.length;
  const verifiedCount = items.length - reviewCount;

  // Items included in the quote (default to included: true if undefined)
  const includedItems = useMemo(
    () => items.filter((i) => i.included !== false),
    [items]
  );
  const selectedCount = includedItems.length;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterMode === "review" && !isItemNeedsReview(item)) return false;
      if (filterMode === "verified" && isItemNeedsReview(item)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (item.itemName || "").toLowerCase().includes(q);
        const matchPart = (item.partNumber || "").toLowerCase().includes(q);
        const matchDesc = (item.description || "").toLowerCase().includes(q);
        const matchSpec = (item.technicalSpecification || "").toLowerCase().includes(q);
        return matchName || matchPart || matchDesc || matchSpec;
      }
      return true;
    });
  }, [items, filterMode, searchQuery]);

  const handleToggleInclude = (id: string, currentVal: boolean) => {
    onUpdateItem(id, { included: !currentVal });
  };

  const handleToggleSelectAll = () => {
    const allSelected = selectedCount === items.length;
    items.forEach((i) => {
      onUpdateItem(i.id, { included: !allSelected });
    });
  };

  // Quick fix: Set default quantity 1 for all items that have missing/zero qty
  const handleQuickFixAllMissingQty = () => {
    needsReviewItems.forEach((item) => {
      const qty = Number(item.quantity);
      onUpdateItem(item.id, {
        quantity: qty > 0 ? qty : 1,
        unit: item.unit || "PCS",
        isMissingQty: false,
        needsReview: false,
      });
    });
  };

  const handleProceed = () => {
    if (reviewCount > 0) {
      setShowConfirmModal(true);
    } else {
      onNext();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
      {/* ── TOP SCROLLABLE CONTAINER ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 max-w-2xl mx-auto w-full space-y-3 pb-28">
        {/* Step Header */}
        <StepHeader
          step={2}
          title="Review Extracted Items"
          subtitle="Quickly verify items from your RFQ before adding commercial prices."
        />

        {/* ── OVERVIEW SUMMARY BAR (Compact Metric Tiles) ── */}
        <div className="grid grid-cols-2 gap-2 bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#0F766E] shrink-0 font-bold">
              {items.length}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-tight">Total Products</p>
              <p className="text-[11px] text-slate-400 font-medium">Extracted from RFQ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFilterMode(reviewCount > 0 ? "review" : "all")}
            className={`flex items-center gap-2.5 px-2 py-1 rounded-lg border transition-all text-left ${
              reviewCount > 0
                ? "bg-amber-50/70 border-amber-200 hover:bg-amber-100/60"
                : "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                reviewCount > 0
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-emerald-600 text-white shadow-xs"
              }`}
            >
              {reviewCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold leading-tight ${reviewCount > 0 ? "text-amber-900" : "text-emerald-900"}`}>
                {reviewCount > 0 ? `${reviewCount} Need Review` : "All Verified"}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {reviewCount > 0 ? "Tap to filter warnings" : "Ready for pricing"}
              </p>
            </div>
          </button>
        </div>

        {/* ── SEARCH & FILTER CONTROLS ── */}
        <div className="space-y-2 sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-xs pt-1 pb-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${items.length} items by name, PN, or spec...`}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-300/80 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & View Toggle */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterMode === "all"
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("review")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterMode === "review"
                    ? "bg-amber-600 text-white shadow-xs"
                    : reviewCount > 0
                    ? "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100/70"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {reviewCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                Needs Review ({reviewCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("verified")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterMode === "verified"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Verified ({verifiedCount})
              </button>
            </div>

            {/* Right: View Density Toggle & Select All */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[11px] font-bold text-[#0F766E] hover:underline px-2 py-1"
              >
                {selectedCount === items.length ? "Deselect All" : "Select All"}
              </button>

              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  title="Compact List View"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "compact" ? "bg-slate-100 text-[#0F766E]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  title="Card View"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "cards" ? "bg-slate-100 text-[#0F766E]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── BATCH WARNING BANNER (When filtering review items) ── */}
        {filterMode === "review" && reviewCount > 0 && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold">{reviewCount} items</span> have missing or unclear quantities from the RFQ.
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFixAllMissingQty}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Set All as 1 PCS
            </button>
          </div>
        )}

        {/* ── PRODUCT LIST (SUPER COMPACT FOR 100 PRODUCTS) ── */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No items match your filter.</p>
            <button
              type="button"
              onClick={() => {
                setFilterMode("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-[#0F766E] hover:underline"
            >
              Clear search & filters
            </button>
          </div>
        ) : viewMode === "compact" ? (
          /* ===== ULTRA-COMPACT ROW VIEW (64px Per Item - Best for 100 items) ===== */
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {filteredItems.map((item, idx) => {
              const category = categorize(item.itemName);
              const meta = CATEGORY_META[category];
              const needsReview = isItemNeedsReview(item);
              const reason = getItemReviewReason(item);
              const isIncluded = item.included !== false;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2.5 p-2.5 transition-colors ${
                    !isIncluded ? "opacity-50 bg-slate-50/50" : needsReview ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-slate-50/70"
                  }`}
                >
                  {/* Inclusion Checkbox */}
                  <label className="grid w-8 h-8 shrink-0 place-items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => handleToggleInclude(item.id, isIncluded)}
                      className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                    />
                  </label>

                  {/* S.No & Category Icon */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center ${meta.badgeBg} ${meta.badgeText}`}
                      title={meta.label}
                    >
                      <CategoryIcon category={category} />
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1 rounded bg-slate-800 text-[9px] font-mono font-bold text-white leading-tight">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Product Info (Click to open edit modal) */}
                  <div
                    onClick={() => setEditingItem(item)}
                    className="flex-1 min-w-0 cursor-pointer pr-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                        {item.itemName || "Unnamed Item"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 font-medium">
                      <span className="font-mono font-semibold text-slate-700">
                        {item.partNumber ? `PN: ${item.partNumber}` : "No PN"}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-[#0F766E]">
                        {item.quantity || 1} {item.unit || "PCS"}
                      </span>
                      {item.technicalSpecification && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-slate-400">
                            {item.technicalSpecification}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Status / Warning Badge & Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {needsReview ? (
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                        title={reason || "Needs review"}
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="hidden min-[400px]:inline">Check</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        <span className="hidden min-[400px]:inline">OK</span>
                      </span>
                    )}

                    {/* Quick Edit Pencil */}
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit Item"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ===== EXPANDED CARDS VIEW (Inline Steppers) ===== */
          <div className="space-y-2.5">
            {filteredItems.map((item, idx) => {
              const category = categorize(item.itemName);
              const meta = CATEGORY_META[category];
              const needsReview = isItemNeedsReview(item);
              const isIncluded = item.included !== false;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-3.5 space-y-2.5 shadow-2xs transition-all ${
                    !isIncluded
                      ? "opacity-60 border-slate-200"
                      : needsReview
                      ? "border-amber-300 ring-1 ring-amber-400/20 bg-amber-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => handleToggleInclude(item.id, isIncluded)}
                        className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                      />
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${meta.badgeBg} ${meta.badgeText}`}
                      >
                        <CategoryIcon category={category} />
                      </div>
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
                        placeholder="Product Name"
                        className="w-full font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0F766E] px-1 py-0.5 rounded focus:outline-none"
                      />
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {needsReview ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          OK
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Part Number & Stepper Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-semibold">PN:</span>
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="e.g. MP-102"
                        className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 max-w-[140px] focus:outline-none focus:border-[#0F766E]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(item.quantity) || 1;
                            if (cur > 1) {
                              onUpdateItem(item.id, { quantity: cur - 1, isMissingQty: false });
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onUpdateItem(item.id, { quantity: val, isMissingQty: false });
                          }}
                          className="w-10 h-7 text-center font-bold text-xs text-slate-800 focus:outline-none border-x border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(item.quantity) || 1;
                            onUpdateItem(item.id, { quantity: cur + 1, isMissingQty: false });
                          }}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <select
                        value={item.unit ? item.unit.toUpperCase() : "PCS"}
                        onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                        className="h-7 px-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="Edit Full Specs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ADD ITEM BUTTON ── */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onAddItem}
            className="w-full h-11 rounded-xl text-xs font-bold border-dashed border-slate-300 text-[#0F766E] hover:bg-teal-50/50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Extra Item</span>
          </Button>
        </div>
      </div>

      {/* ── STICKY BOTTOM ACTION BAR (Ultra Compact Mobile Friendly) ── */}
      <footer className="shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="h-11 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-colors"
            title="Back to Step 1 (Upload RFQ)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden min-[380px]:inline">Upload</span>
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              {selectedCount} of {items.length} Selected
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {reviewCount > 0 ? (
                <span className="text-amber-700 font-bold">{reviewCount} need review</span>
              ) : (
                <span className="text-emerald-700 font-bold">All verified</span>
              )}
            </p>
          </div>

          <Button
            onClick={handleProceed}
            className="h-11 px-4 sm:px-6 rounded-xl font-extrabold text-xs sm:text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-md shadow-[#0F766E]/20 flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-[0.98]"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </footer>

      {/* ── CONFIRMATION MODAL (If items still need review) ── */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {reviewCount} {reviewCount === 1 ? "Item Still Needs" : "Items Still Need"} Review
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Some extracted items have missing or unclear quantities from the RFQ. Unchecked items might result in inaccurate quotation pricing.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setFilterMode("review");
                }}
                className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold transition-colors"
              >
                Review Items Now
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  onNext();
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ITEM MODAL ── */}
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
