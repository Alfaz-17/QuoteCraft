"use client";

import React from "react";
import { TableColumn, QuotationState } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, GripVertical, Check, Eye, EyeOff } from "lucide-react";

interface StepCustomizeColumnsProps {
  state: QuotationState;
  onUpdateColumn: (id: string, updates: Partial<TableColumn>) => void;
  onSetColumns: (cols: TableColumn[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCustomizeColumns({
  state,
  onUpdateColumn,
  onSetColumns,
  onNext,
  onBack,
}: StepCustomizeColumnsProps) {
  const { tableColumns } = state;
  const isLandscape = state.pdfOrientation === "landscape";

  // Standard core columns list with clear marine friendly descriptions
  const visibleCount = tableColumns.filter((c) => c.visible).length;

  const handleToggleColumn = (id: string, currentVisible: boolean) => {
    onUpdateColumn(id, { visible: !currentVisible });
  };

  const handleMoveColumn = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= tableColumns.length) return;
    const next = [...tableColumns];
    [next[index], next[target]] = [next[target], next[index]];
    onSetColumns(next);
  };

  return (
    <div className="max-w-6xl mx-auto py-5 sm:py-8 px-3 sm:px-6 space-y-6 animate-in fade-in duration-300 pb-28">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Choose What Appears in Your Quotation
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Drag to reorder. Uncheck fields you don&apos;t want your customer to see on the generated PDF.
        </p>
      </div>

      {/* Main 2-Column Split: Column Checklist on Left, Live Layout Skeleton on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Column Checklist (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
              Available Quotation Fields
            </span>
            <span className="font-mono text-primary font-bold text-xs">
              {visibleCount} fields visible
            </span>
          </div>

          <div className="space-y-2">
            {tableColumns.map((col, idx) => {
              const isLocked = col.role === "total"; // Total must stay in quotation
              return (
                <div
                  key={col.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    col.visible
                      ? "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                      : "bg-slate-50/60 border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Drag Handle Indicator */}
                    <div className="flex items-center gap-0.5 text-slate-300 hover:text-slate-500 cursor-grab">
                      <GripVertical className="w-4 h-4 shrink-0" />
                    </div>

                    {/* Checkbox */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleToggleColumn(col.id, col.visible)}
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                        col.visible
                          ? "bg-primary text-white shadow-xs shadow-primary/20"
                          : "border border-slate-300 bg-white"
                      } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {col.visible && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {col.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {col.key === "itemName"
                          ? "Item description & technical specifications"
                          : col.key === "partNumber"
                          ? "Manufacturer or IMPA part number"
                          : col.key === "quantity"
                          ? "Quantity and unit of measurement"
                          : col.key === "unitPrice"
                          ? "Unit selling rate"
                          : col.key === "total"
                          ? "Calculated row total (mandatory)"
                          : "Custom supplier field"}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Reorder up/down & visibility status */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveColumn(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveColumn(idx, 1)}
                      disabled={idx === tableColumns.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      ▼
                    </button>

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleToggleColumn(col.id, col.visible)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        col.visible
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {col.visible ? "Visible" : "Hidden"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Preview Layout Skeleton (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" /> Preview Table Layout
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {isLandscape ? "Landscape A4" : "Portrait A4"}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Here is how your table columns will balance across the page width:
          </p>

          {/* Interactive Skeleton Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
            {/* Table Header */}
            <div className="bg-slate-900 text-white flex items-center text-[10px] font-bold uppercase tracking-wider p-2 divide-x divide-slate-800">
              {tableColumns
                .filter((c) => c.visible)
                .map((c) => (
                  <div
                    key={c.id}
                    className="px-2 truncate text-center flex-1"
                    title={c.label}
                  >
                    {c.label}
                  </div>
                ))}
            </div>

            {/* Simulated 3 Rows */}
            {[1, 2, 3].map((r) => (
              <div
                key={r}
                className="flex items-center text-xs p-2.5 border-t border-slate-200/70 divide-x divide-slate-100 bg-white"
              >
                {tableColumns
                  .filter((c) => c.visible)
                  .map((c) => (
                    <div key={c.id} className="px-2 truncate flex-1 text-[11px] text-slate-600">
                      {c.key === "sno" ? (
                        <span className="text-slate-400 font-mono text-center block">{r}</span>
                      ) : c.key === "itemName" ? (
                        <span className="font-bold text-slate-800">
                          {r === 1 ? "CYLINDER LINER" : r === 2 ? "EXHAUST VALVE" : "FUEL INJECTOR"}
                        </span>
                      ) : c.key === "partNumber" ? (
                        <span className="font-mono text-center block text-[10px]">
                          {r === 1 ? "CL-102" : r === 2 ? "EV-204" : "FI-301"}
                        </span>
                      ) : c.role === "qty" ? (
                        <span className="text-center block font-semibold">{r * 2} PCS</span>
                      ) : c.role === "price" ? (
                        <span className="text-right block font-mono">$100</span>
                      ) : c.role === "total" ? (
                        <span className="text-right block font-mono font-bold">${r * 200}</span>
                      ) : (
                        <span className="text-center block text-slate-400">-</span>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
            <span className="text-primary font-black mt-0.5">💡</span>
            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
              <strong>Smart Auto-Format:</strong> Technical specifications and secondary attributes are automatically placed beneath the item description so the columns stay readable without text wrapping into letters.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar on Mobile & Desktop (Screen 6 in Mobile Mockup: Save Changes) */}
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
            Save Changes
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

