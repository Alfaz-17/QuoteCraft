"use client";

import React, { useState } from "react";
import { LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Settings2, 
  Eye, 
  EyeOff, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Check,
  Info
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
  onDuplicateItem,
  onReorderItem,
  onUpdateColumn,
  onDeleteColumn,
  onAddColumn,
  onSetColumns,
  onNext,
  onBack,
}: Step2CheckItemsProps) {
  const [filterUncertainOnly, setFilterUncertainOnly] = useState(false);
  const [showColManager, setShowColManager] = useState(false);
  const [newColLabel, setNewColLabel] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";

  // Check if a row has missing or suspicious data
  const isRowUncertain = (item: LineItem): boolean => {
    if (item.needsReview || item.isMissingQty) return true;
    const qtyVal = toNumber(item[qtyKey]);
    const hasNoQty = !qtyVal || qtyVal <= 0;
    const hasNoName = !item.itemName || !item.itemName.trim();
    return hasNoQty || hasNoName;
  };

  const uncertainCount = items.filter(isRowUncertain).length;
  const displayedItems = filterUncertainOnly ? items.filter(isRowUncertain) : items;

  const handleAddCustomColumn = () => {
    if (!newColLabel.trim()) return;
    const key = `x_${newColLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || Date.now()}`;
    onAddColumn({
      id: `custom_${Date.now()}`,
      label: newColLabel.trim(),
      key,
      type: "text",
      visible: true,
      width: "110px",
    });
    setNewColLabel("");
  };

  const moveColumn = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= tableColumns.length) return;
    const next = [...tableColumns];
    [next[index], next[target]] = [next[target], next[index]];
    onSetColumns(next);
  };

  const markRowVerified = (id: string) => {
    onUpdateItem(id, { needsReview: false, isMissingQty: false });
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-7 px-3 sm:px-6 space-y-4 sm:space-y-5 animate-in fade-in duration-300 pb-28">
      {/* Upfront Summary & Control Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {items.length} line item(s)
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {tableColumns.filter((c) => c.visible).length} columns
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Review item descriptions, part numbers, and quantities.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {uncertainCount > 0 && (
            <button
              onClick={() => setFilterUncertainOnly(!filterUncertainOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all min-h-[40px] ${
                filterUncertainOnly
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{uncertainCount} need review</span>
              <span className="text-[10px] uppercase underline ml-0.5">
                {filterUncertainOnly ? "Show all" : "Filter"}
              </span>
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColManager(!showColManager)}
            className="h-10 px-3.5 rounded-xl font-bold text-xs border-slate-200 min-h-[40px]"
          >
            <Settings2 className="w-3.5 h-3.5 mr-1 text-slate-500" /> Columns
          </Button>

          <Button
            size="sm"
            onClick={onAddItem}
            className="h-10 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white min-h-[40px] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
          </Button>

          <Button
            onClick={onNext}
            className="h-10 px-5 rounded-xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 min-h-[40px] active:scale-[0.98]"
          >
            Next: Add prices <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Flagged Alert Banner */}
      {uncertainCount > 0 && !filterUncertainOnly && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 sm:p-4 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{uncertainCount} item(s) require review:</strong> Missing quantity or description. Missing values were not silently guessed.
            </span>
          </div>
          <button
            onClick={() => setFilterUncertainOnly(true)}
            className="font-bold underline text-amber-900 text-xs shrink-0 ml-2"
          >
            Filter flagged
          </button>
        </div>
      )}

      {/* Column Customizer Panel */}
      {showColManager && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Customize Table Columns
            </h4>
            <button
              onClick={() => setShowColManager(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {tableColumns.map((col, idx) => (
              <div
                key={col.id}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold ${
                  col.visible ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => onUpdateColumn(col.id, { visible: !col.visible })}
                    className="text-slate-500 hover:text-slate-900"
                    title={col.visible ? "Hide" : "Show"}
                  >
                    {col.visible ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="truncate">{col.label}</span>
                </div>

                <div className="flex items-center gap-1">
                  {col.id.startsWith("custom_") && (
                    <button
                      onClick={() => onDeleteColumn(col.id)}
                      className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                      title="Delete custom column"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => moveColumn(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveColumn(idx, 1)}
                    disabled={idx === tableColumns.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm pt-1">
            <Input
              value={newColLabel}
              onChange={(e) => setNewColLabel(e.target.value)}
              placeholder="Add new custom column..."
              className="h-9 text-xs rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomColumn()}
            />
            <Button size="sm" onClick={handleAddCustomColumn} className="h-9 font-bold text-xs px-4 rounded-xl">
              Add
            </Button>
          </div>
        </div>
      )}

      {/* DESKTOP HIGH-DENSITY REVIEW SPREADSHEET TABLE */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[240px]">Item Description</th>
                <th className="py-2.5 px-3 min-w-[120px]">Part No</th>
                <th className="py-2.5 px-3 w-24 text-right">Qty</th>
                <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                <th className="py-2.5 px-3 min-w-[100px]">Condition</th>
                <th className="py-2.5 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedItems.map((item, index) => {
                const uncertain = isRowUncertain(item);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${
                      uncertain
                        ? "bg-amber-50/70 hover:bg-amber-100/60 border-l-4 border-l-amber-500"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* Item Description */}
                    <td className="py-1 px-2">
                      <input
                        value={item.itemName || ""}
                        onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                        placeholder="Item name / description"
                        className="w-full h-8 px-2 font-semibold text-slate-900 bg-transparent rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent outline-none transition-all"
                      />
                    </td>

                    {/* Part Number */}
                    <td className="py-1 px-2">
                      <input
                        value={item.partNumber || ""}
                        onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                        placeholder="Part No."
                        className="w-full h-8 px-2 font-mono text-xs text-slate-700 bg-transparent rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent outline-none transition-all"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="py-1 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={typeof item[qtyKey] === "number" && item[qtyKey] !== 0 ? item[qtyKey] : ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          onUpdateItem(item.id, { 
                            [qtyKey]: val,
                            needsReview: val <= 0,
                            isMissingQty: val <= 0
                          });
                        }}
                        placeholder="0"
                        className={`w-full h-8 px-2 text-right font-bold bg-transparent rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border outline-none transition-all ${
                          !toNumber(item[qtyKey])
                            ? "border-amber-400 bg-amber-100/50 text-amber-900 font-black"
                            : "border-transparent text-slate-900"
                        }`}
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-1 px-2 text-center">
                      <input
                        value={item.unit || "pcs"}
                        onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                        className="w-full h-8 text-center uppercase text-xs font-semibold text-slate-600 bg-transparent rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent outline-none transition-all"
                      />
                    </td>

                    {/* Condition */}
                    <td className="py-1 px-2">
                      <input
                        value={item.condition || ""}
                        onChange={(e) => onUpdateItem(item.id, { condition: e.target.value })}
                        placeholder="New / OEM"
                        className="w-full h-8 px-2 text-xs text-slate-600 bg-transparent rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent outline-none transition-all"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-1 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {uncertain && (
                          <button
                            type="button"
                            onClick={() => markRowVerified(item.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                            title="Confirm as Verified"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onReorderItem(item.id, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 disabled:opacity-20 transition-colors"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReorderItem(item.id, "down")}
                          disabled={index === displayedItems.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 disabled:opacity-20 transition-colors"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateItem(item.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE SPECIFIC ITEM CARDS (NO CRAMPED HORIZONTAL TABLE SCROLL) */}
      <div className="block md:hidden space-y-3">
        {displayedItems.map((item, index) => {
          const uncertain = isRowUncertain(item);
          const isExpanded = expandedItemId === item.id;
          const qtyVal = toNumber(item[qtyKey]);

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition-all shadow-xs space-y-3 ${
                uncertain
                  ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20"
                  : "bg-white border-slate-200/80"
              }`}
            >
              {/* Card Header: Index & Title & Review badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  {uncertain && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
                      Needs Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onReorderItem(item.id, "up")}
                    disabled={index === 0}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-20"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderItem(item.id, "down")}
                    disabled={index === displayedItems.length - 1}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-20"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateItem(item.id)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Item Description Input (Large Touch Target) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Item Description
                </label>
                <input
                  value={item.itemName || ""}
                  onChange={(e) => onUpdateItem(item.id, { itemName: e.target.value })}
                  placeholder="e.g. Exhaust Valve Spindle"
                  className="w-full h-11 px-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              {/* Quantity, Unit & Part Number Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Part No
                  </label>
                  <input
                    value={item.partNumber || ""}
                    onChange={(e) => onUpdateItem(item.id, { partNumber: e.target.value })}
                    placeholder="Part #"
                    className="w-full h-11 px-2.5 font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${!qtyVal ? "text-amber-700 font-black" : "text-slate-400"}`}>
                    Quantity {!qtyVal && "*"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={typeof item[qtyKey] === "number" && item[qtyKey] !== 0 ? item[qtyKey] : ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateItem(item.id, { 
                        [qtyKey]: val,
                        needsReview: val <= 0,
                        isMissingQty: val <= 0
                      });
                    }}
                    placeholder="0"
                    className={`w-full h-11 px-2.5 font-mono text-sm font-bold text-right rounded-xl border outline-none ${
                      !qtyVal
                        ? "border-amber-400 bg-amber-100/60 text-amber-950 font-black"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Unit
                  </label>
                  <input
                    value={item.unit || "pcs"}
                    onChange={(e) => onUpdateItem(item.id, { unit: e.target.value })}
                    placeholder="pcs"
                    className="w-full h-11 px-2 text-center uppercase text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Expandable Technical Details Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 min-h-[36px]"
                >
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>{isExpanded ? "Hide specs" : "More specs (Condition, Description)"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="pt-2 space-y-2 border-t border-slate-100 mt-1 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500">Condition</label>
                      <input
                        value={item.condition || ""}
                        onChange={(e) => onUpdateItem(item.id, { condition: e.target.value })}
                        placeholder="e.g. New / OEM / Reconditioned"
                        className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500">Long Description / Specs</label>
                      <input
                        value={item.description || ""}
                        onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                        placeholder="Technical remarks..."
                        className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Verify Action Button for flagged rows */}
              {uncertain && (
                <div className="pt-1 border-t border-amber-200/60 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => markRowVerified(item.id)}
                    className="h-9 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-h-[40px] flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Confirm Item
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 px-5 rounded-2xl font-bold text-xs border-slate-200 min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Document Details
        </Button>

        <Button
          onClick={onNext}
          className="h-11 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 min-h-[44px] active:scale-[0.98]"
        >
          Next: Add prices ({items.length} items) <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
