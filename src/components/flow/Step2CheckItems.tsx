"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { QuotationState, LineItem, TableColumn, Currency } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
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
  Sparkles,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown
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

export const MARINE_COLUMN_PRESETS = [
  { id: "impaCode", label: "IMPA Code", key: "impaCode", type: "text" as const, description: "Standard 6-digit marine catalogue code", icon: "⚓" },
  { id: "maker", label: "Maker / Brand", key: "maker", type: "text" as const, description: "Original equipment manufacturer", icon: "🏭" },
  { id: "leadTime", label: "Delivery Lead Time", key: "leadTime", type: "text" as const, description: "Delivery window or stock location", icon: "⏱️" },
  { id: "condition", label: "Condition / Class", key: "condition", type: "text" as const, description: "Equipment grade & certification", icon: "🔍" },
  { id: "warranty", label: "Warranty Period", key: "warranty", type: "text" as const, description: "Manufacturer or supplier warranty", icon: "🛡️" },
  { id: "origin", label: "Country of Origin", key: "origin", type: "text" as const, description: "Country of manufacture", icon: "🌍" },
  { id: "hsCode", label: "HS / Customs Code", key: "hsCode", type: "text" as const, description: "Customs classification code", icon: "🏷️" },
  { id: "remarks", label: "Remarks / Notes", key: "remarks", type: "text" as const, description: "Line notes or drawings", icon: "📋" },
];

export function Step2CheckItems({
  state,
  items,
  tableColumns = [],
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onUpdateClient,
  onUpdateDocInfo,
  onUpdateColumn,
  onDeleteColumn,
  onAddColumn,
  onSetColumns,
  onClearExtraction,
  onNext,
  onBack,
}: Step2CheckItemsProps) {
  const { info: toastInfo } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "review" | "verified">("all");
  const [viewMode, setViewMode] = useState<"compact" | "cards">("compact");
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);

  // Column Customizer Modal States
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState<"text" | "number">("text");

  const handleAddPresetColumn = (preset: typeof MARINE_COLUMN_PRESETS[0]) => {
    const existing = tableColumns.find((c) => c.key === preset.key || c.id === preset.id);
    if (existing) {
      if (!existing.visible && onUpdateColumn) {
        onUpdateColumn(existing.id, { visible: true });
        toastInfo(`Enabled ${preset.label} column!`);
      } else {
        toastInfo(`${preset.label} column is already active.`);
      }
      return;
    }
    if (onAddColumn) {
      onAddColumn({
        id: preset.id,
        label: preset.label,
        key: preset.key,
        type: preset.type,
        visible: true,
        width: "110px",
      });
      toastInfo(`Added ${preset.label} column to quotation!`);
    }
  };

  const handleCreateCustomColumn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const label = newColLabel.trim();
    if (!label) return;
    const cleanKey = `x_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || Date.now()}`;
    if (onAddColumn) {
      onAddColumn({
        id: `col_${Date.now()}`,
        label,
        key: cleanKey,
        type: newColType,
        visible: true,
        width: "110px",
      });
      setNewColLabel("");
      toastInfo(`Added custom column "${label}"!`);
    }
  };

  const handleMoveColumn = (index: number, direction: -1 | 1) => {
    if (!onSetColumns) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= tableColumns.length) return;
    const updated = [...tableColumns];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onSetColumns(updated);
  };

  // A newly added blank item opens straight in the editor so the user can type its name
  const prevCountRef = useRef(items.length);
  useEffect(() => {
    const last = items[items.length - 1];
    if (items.length === prevCountRef.current + 1 && last && !last.itemName?.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingItem(last);
    }
    prevCountRef.current = items.length;
  }, [items]);

  // Review status calculation
  const activeCustomCols = useMemo(() => {
    return tableColumns.filter(
      (c) =>
        c.visible &&
        !["sno", "itemName", "name", "description", "partNumber", "quantity", "qty", "unit", "unitPrice", "rate", "total", "id", "included", "isTba", "needsReview", "isMissingQty", "category"].includes(c.key)
    );
  }, [tableColumns]);

  const getItemReviewReason = (item: LineItem): string | null => {
    if (item.isMissingQty) return "Quantity unclear in RFQ";
    if (!item.quantity || Number(item.quantity) <= 0) return "Please check quantity";
    if (!item.itemName || !item.itemName.trim()) return "Missing item name";
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
    if (items.length === 0) {
      onAddItem();
      return;
    }
    const missingQty = items.filter(
      (i) => i.included !== false && (!Number(i.quantity) || Number(i.quantity) <= 0)
    ).length;
    if (missingQty > 0) {
      // Step 3 has no quantity field, so a 0 qty would silently price the line at 0
      setFilterMode("review");
      toastInfo(`${missingQty} item(s) have no quantity. Set them, or tap "Auto-Set All as 1 PCS".`);
      return;
    }
    if (selectedCount === 0) {
      handleToggleSelectAll();
    }
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* ── TOP SCROLLABLE CONTAINER ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full space-y-4 pb-28">
        {/* Step Header */}
        <StepHeader
          step={2}
          title="Review Extracted Items"
          subtitle="Quickly verify items from your RFQ before adding commercial prices."
        />

        {/* RFQ Header Summary (Vessel, Customer, Ref, Date) */}
        {(state?.documentInfo?.vessel || state?.client?.companyName || state?.documentInfo?.reference) && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {state?.documentInfo?.vessel && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Vessel:</span>
                  <span className="font-bold text-slate-900">{state.documentInfo.vessel}</span>
                </div>
              )}
              {state?.client?.companyName && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Buyer:</span>
                  <span className="font-bold text-slate-900">{state.client.companyName}</span>
                </div>
              )}
              {state?.documentInfo?.reference && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Ref:</span>
                  <span className="font-mono font-bold text-[#0F766E]">{state.documentInfo.reference}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                RFQ Details Detected
              </span>
              {onClearExtraction && (
                <button
                  type="button"
                  onClick={onClearExtraction}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                >
                  Discard &amp; Re-Upload
                </button>
              )}
            </div>
          </div>
        )}

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
        <div className="space-y-2 sticky top-0 z-10 bg-background/95 backdrop-blur-xs pt-1 pb-2">
          {/* Top Bar: Search Input + Columns Button + Add Item */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${items.length} items by name, PN, or spec...`}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-300/80 bg-white text-base sm:text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Columns Customizer Button */}
            <button
              type="button"
              onClick={() => setShowColumnModal(true)}
              className="h-10 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
              title="Customize Quotation Columns & Marine Presets"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F766E]" />
              <span className="hidden min-[480px]:inline">Columns</span>
              <span className="px-1.5 py-0.2 rounded-full bg-teal-50 text-[#0F766E] text-[10px] font-mono font-bold border border-teal-200">
                {tableColumns.filter((c) => c.visible).length}
              </span>
            </button>

            {/* Quick Add Line Item Button */}
            <button
              type="button"
              onClick={onAddItem}
              className="h-10 px-3.5 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              title="Add a new line item manually"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
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
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">No items in this quotation yet</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Add your first line item manually or return to upload an RFQ document.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                onClick={onAddItem}
                className="h-10 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add First Item
              </Button>
              <button
                type="button"
                onClick={onBack}
                className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Upload RFQ
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
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
                  <label className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center cursor-pointer -ml-1">
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
                        {item.itemName || item.description || "Unnamed Item"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 font-medium">
                      <span className="font-mono font-semibold text-slate-700">
                        {item.partNumber ? `PN: ${item.partNumber}` : "No PN"}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-[#0F766E]">
                        {Number(item.quantity) > 0 ? `${item.quantity} ${item.unit || "PCS"}` : "Qty missing"}
                      </span>
                      {item.technicalSpecification && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-slate-400">
                            {item.technicalSpecification}
                          </span>
                        </>
                      )}
                      {activeCustomCols.map((col) => {
                        const val = item[col.key];
                        if (val === undefined || val === null || String(val).trim() === "") return null;
                        return (
                          <span
                            key={col.id || col.key}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50/80 text-teal-900 border border-teal-200/60 text-[10px] font-medium"
                          >
                            <span className="text-teal-700/70 font-normal">{col.label}:</span>
                            <span className="font-bold">{String(val)}</span>
                          </span>
                        );
                      })}
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
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit Item"
                      aria-label="Edit Item"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Item"
                      aria-label="Delete Item"
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
                      <label className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer shrink-0 -ml-1">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => handleToggleInclude(item.id, isIncluded)}
                          className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                        />
                      </label>
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
                        className="w-full font-bold text-base sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0F766E] px-1 py-0.5 rounded focus:outline-none"
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
                        className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-300 hover:text-rose-600 rounded transition-colors"
                        aria-label="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Part Number & Stepper Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-semibold">PN:</span>
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="e.g. MP-102"
                        className="font-mono text-base sm:text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 max-w-[140px] focus:outline-none focus:border-[#0F766E]"
                      />
                      {activeCustomCols.map((col) => {
                        const val = item[col.key];
                        if (val === undefined || val === null || String(val).trim() === "") return null;
                        return (
                          <span
                            key={col.id || col.key}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50/80 text-teal-900 border border-teal-200/60 text-[10px] font-medium"
                          >
                            <span className="text-teal-700/70 font-normal">{col.label}:</span>
                            <span className="font-bold">{String(val)}</span>
                          </span>
                        );
                      })}
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
                          className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-600 hover:bg-slate-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          inputMode="decimal"
                          value={item.quantity || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onUpdateItem(item.id, { quantity: val, isMissingQty: false });
                          }}
                          className="w-12 h-9 text-center font-bold text-base sm:text-xs text-slate-800 focus:outline-none border-x border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(item.quantity) || 1;
                            onUpdateItem(item.id, { quantity: cur + 1, isMissingQty: false });
                          }}
                          className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-600 hover:bg-slate-100"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <select
                        value={item.unit ? item.unit.toUpperCase() : "PCS"}
                        onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                        className="h-9 px-2 rounded-lg border border-slate-300 text-base sm:text-xs font-bold text-slate-700 bg-white"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Full Specs"
                        aria-label="Edit Full Specs"
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
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="h-11 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-colors"
              title="Back to Step 1 (Upload RFQ)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden min-[380px]:inline">Upload</span>
            </button>

            {onClearExtraction && (
              <button
                type="button"
                onClick={onClearExtraction}
                className="h-11 px-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-colors"
                title="Discard extracted items and start fresh"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discard</span>
              </button>
            )}
          </div>

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

      {/* ── EDIT ITEM MODAL ── */}
      <EditItemModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        tableColumns={tableColumns}
        onClose={() => setEditingItem(null)}
        onSave={(id, updates) => {
          onUpdateItem(id, updates);
          setEditingItem(null);
        }}
      />

      {/* ── COLUMN CUSTOMIZER MODAL ── */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Quotation Table Columns</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Add standard marine fields or create custom columns</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Marine Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Quick-Add Marine Presets
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">1-Click Maritime Fields</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MARINE_COLUMN_PRESETS.map((preset) => {
                    const isAdded = tableColumns.some((c) => c.key === preset.key || c.id === preset.id);
                    const isVisible = tableColumns.some((c) => (c.key === preset.key || c.id === preset.id) && c.visible);

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAddPresetColumn(preset)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isVisible
                            ? "bg-teal-50/70 border-teal-200 text-teal-900"
                            : isAdded
                            ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "bg-white border-slate-200 hover:border-[#0F766E]/40 hover:bg-teal-50/20 text-slate-800"
                        }`}
                      >
                        <span className="text-base shrink-0 select-none">{preset.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold truncate">{preset.label}</span>
                            {isVisible ? (
                              <span className="text-[9px] font-extrabold bg-[#0F766E] text-white px-1.5 py-0.2 rounded-full shrink-0">
                                Active
                              </span>
                            ) : isAdded ? (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                                Hidden
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-[#0F766E] hover:underline shrink-0">
                                + Add
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Columns List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Current Columns ({tableColumns.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Reorder &amp; Toggle Visibility</span>
                </div>

                <div className="space-y-1.5">
                  {tableColumns.map((col, idx) => {
                    const isProtected = col.role === "total" || col.role === "qty" || col.role === "price" || col.key === "sno" || col.key === "itemName";

                    return (
                      <div
                        key={col.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          col.visible ? "bg-white border-slate-200 shadow-2xs" : "bg-slate-50/80 border-slate-200/60 opacity-60"
                        }`}
                      >
                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => onUpdateColumn && onUpdateColumn(col.id, { visible: !col.visible })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            col.visible ? "text-[#0F766E] hover:bg-teal-50" : "text-slate-400 hover:bg-slate-200"
                          }`}
                          title={col.visible ? "Hide from quotation & PDF" : "Show in quotation & PDF"}
                        >
                          {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {/* Label Editor */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => onUpdateColumn && onUpdateColumn(col.id, { label: e.target.value })}
                            className="w-full h-8 px-2 rounded-lg border border-transparent hover:border-slate-300 focus:border-[#0F766E] bg-transparent text-xs font-bold text-slate-800 focus:bg-white focus:outline-none transition-colors"
                            placeholder="Column Label"
                          />
                        </div>

                        {/* Column Role / Type Badge */}
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {col.role || col.type || "text"}
                        </span>

                        {/* Move Up / Down Buttons */}
                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveColumn(idx, -1)}
                            disabled={idx === 0}
                            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveColumn(idx, 1)}
                            disabled={idx === tableColumns.length - 1}
                            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete Button (if not protected) */}
                        {!isProtected ? (
                          <button
                            type="button"
                            onClick={() => onDeleteColumn && onDeleteColumn(col.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                            title="Delete Column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-8 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Column Form */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Add New Custom Column
                </h4>
                <form onSubmit={handleCreateCustomColumn} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newColLabel}
                    onChange={(e) => setNewColLabel(e.target.value)}
                    placeholder="e.g. Serial Number, Certification..."
                    className="flex-1 min-w-[180px] h-9 px-3 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as "text" | "number")}
                    className="h-9 px-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0F766E]"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={!newColLabel.trim()}
                    className="h-9 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold shrink-0 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => setShowColumnModal(false)}
                className="h-9 px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold shadow-xs"
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
