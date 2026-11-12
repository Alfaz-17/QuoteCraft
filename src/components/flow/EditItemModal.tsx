"use client";

import React, { useState, useEffect } from "react";
import { LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Cog, Check } from "lucide-react";

interface EditItemModalProps {
  isOpen: boolean;
  item: LineItem | null;
  tableColumns?: TableColumn[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<LineItem>) => void;
}

const COMMON_UNITS = ["PCS", "SETS", "LOT", "KGS", "MTR", "BOX", "DRUM", "PAIR"];

export function EditItemModal({
  isOpen,
  item,
  tableColumns = [],
  onClose,
  onSave,
}: EditItemModalProps) {
  const [description, setDescription] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("PCS");
  const [unitPrice, setUnitPrice] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  // Additional visible columns not covered by core inputs
  const additionalColumns = tableColumns.filter(
    (col) =>
      col.visible &&
      !["sno", "itemName", "name", "description", "partNumber", "quantity", "qty", "unit", "unitPrice", "rate", "total"].includes(col.key)
  );

  useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(item.itemName || "");
      setPartNumber(item.partNumber || "");
      setQuantity(String(item.quantity ?? 1));
      setUnit(item.unit || "PCS");
      setUnitPrice(item.unitPrice ? String(item.unitPrice) : "");

      const customs: Record<string, string> = {};
      tableColumns.forEach((col) => {
        if (!["sno", "itemName", "name", "description", "partNumber", "quantity", "qty", "unit", "unitPrice", "rate", "total"].includes(col.key)) {
          customs[col.key] = item[col.key] !== undefined && item[col.key] !== null ? String(item[col.key]) : "";
        }
      });
      setCustomValues(customs);
    }
  }, [item, tableColumns]);

  if (!isOpen || !item) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity) || 1;
    const priceNum = parseFloat(unitPrice) || 0;

    onSave(item.id, {
      itemName: description.trim() || item.itemName,
      partNumber: partNumber.trim(),
      quantity: qtyNum,
      unit: unit.trim().toUpperCase() || "PCS",
      unitPrice: priceNum,
      ...customValues,
      isMissingQty: false,
      needsReview: false,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Item"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full max-h-[90dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* ===== SCREEN 4: HEADER ===== */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors -ml-1"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-[#0F172A]">
              Edit Item
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Visual Component Badge (Screen 4 in Mockup) */}
          <div className="flex justify-center pt-1 pb-1">
            <div className="w-16 h-16 rounded-2xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shadow-inner border border-teal-100">
              <Cog className="w-8 h-8 stroke-[1.8] animate-spin-slow" />
            </div>
          </div>

          {/* Item Name * */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#0F172A]">
              Item Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Marine Bearing"
              className="h-11 text-base sm:text-sm rounded-xl border-slate-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          {/* Part Number (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#0F172A]">
              Part Number <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <Input
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="e.g. PN-MB-001"
              className="h-11 font-mono text-base sm:text-sm rounded-xl border-slate-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          {/* Quantity * & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0F172A]">
                Quantity <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                type="number"
                min="0.01"
                step="any"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                className="h-11 font-mono text-base sm:text-sm rounded-xl border-slate-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0F172A]">
                Unit
              </Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-3 text-base sm:text-sm font-semibold text-[#0F172A] bg-white rounded-xl border border-slate-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Unit Price */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#0F172A]">
              Unit Price (Optional)
            </Label>
            <Input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
              className="h-11 font-mono text-base sm:text-sm rounded-xl border-slate-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            />
          </div>

          {/* Dynamic Business & Custom Columns */}
          {additionalColumns.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Custom Specifications &amp; Commercial Terms
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {additionalColumns.map((col) => (
                  <div key={col.id} className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                      <span>{col.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal uppercase">{col.type}</span>
                    </Label>
                    <Input
                      type={col.type === "number" ? "number" : "text"}
                      value={customValues[col.key] || ""}
                      onChange={(e) =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [col.key]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${col.label.toLowerCase()}...`}
                      className="h-11 text-base sm:text-sm rounded-xl border-slate-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons (Screen 4 in Mockup: Cancel & Save Changes) */}
          <div className="pt-3 pb-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-xs font-bold border-slate-300 text-[#475569] hover:bg-slate-50 min-h-[48px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 rounded-xl text-xs font-bold bg-[#0F766E] hover:bg-[#0D6B63] active:scale-[0.98] text-white shadow-md shadow-[#0F766E]/20 min-h-[48px]"
            >
              <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
