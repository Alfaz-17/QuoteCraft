"use client";

import { LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Settings2, X, Eye, EyeOff } from "lucide-react";
import { calculateRowTotal } from "@/utils/calculations";
import { COMMON_MARINE_PARTS } from "@/constants/marine-parts";
import { useState } from "react";

interface ItemsTableProps {
  items: LineItem[];
  tableColumns: TableColumn[];
  onUpdate: (id: string, updates: Partial<LineItem>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onAddColumn: (col: TableColumn) => void;
  onDeleteColumn: (id: string) => void;
  onUpdateColumn: (id: string, updates: Partial<TableColumn>) => void;
}

export function ItemsTable({
  items,
  tableColumns,
  onUpdate,
  onDelete,
  onAdd,
  onAddColumn,
  onDeleteColumn,
  onUpdateColumn,
}: ItemsTableProps) {
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");

  const visibleColumns = tableColumns.filter(c => c.visible);



  const handleAddColumn = () => {
    if (!newColumnLabel.trim()) return;
    const key = newColumnLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");
    onAddColumn({
      id: `custom_${Date.now()}`,
      label: newColumnLabel.trim(),
      key,
      type: "text",
      visible: true,
      width: "100px",
    });
    setNewColumnLabel("");
  };

  const getCellValue = (item: LineItem, col: TableColumn, index: number): string => {
    if (col.key === "sno") return (index + 1).toString();
    if (col.key === "total") return calculateRowTotal(item).toFixed(2);
    const val = item[col.key];
    if (val === undefined || val === null) return "";
    return String(val);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Parts Table</h3>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowColumnManager(!showColumnManager)}
            className={`gap-1 rounded-full text-[11px] h-8 px-3 ${showColumnManager ? "bg-primary/10 text-primary" : ""}`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Columns
          </Button>
          <Button size="sm" onClick={onAdd} className="gap-1 rounded-full shadow-sm text-[11px] h-8 px-3">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </Button>
        </div>
      </div>

      {/* Column Manager */}
      {showColumnManager && (
        <div className="p-3 rounded-xl border bg-white/80 backdrop-blur-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage Columns</p>
          <div className="flex flex-wrap gap-1.5">
            {tableColumns.map(col => (
              <div
                key={col.id}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                  col.visible ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground"
                }`}
              >
                <button onClick={() => onUpdateColumn(col.id, { visible: !col.visible })} className="hover:scale-110 transition-transform">
                  {col.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <Input
                  value={col.label}
                  onChange={e => onUpdateColumn(col.id, { label: e.target.value })}
                  className="h-5 w-[70px] text-[10px] font-bold bg-transparent border-none shadow-none p-0 focus-visible:ring-0"
                />
                {col.id.startsWith("custom_") && (
                  <button onClick={() => onDeleteColumn(col.id)} className="text-destructive hover:scale-110 transition-transform">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center pt-1">
            <Input
              placeholder="New column name..."
              value={newColumnLabel}
              onChange={e => setNewColumnLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddColumn()}
              className="h-8 text-xs flex-1"
            />
            <Button size="sm" variant="outline" onClick={handleAddColumn} className="h-8 text-[11px] gap-1 rounded-full">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>
      )}

      {/* Card-based rows for each item */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border bg-white p-3 space-y-2.5 shadow-sm group relative">
            {/* Row Number + Delete */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 w-6 h-6 rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                className="h-6 w-6 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Item Name - full width with good height */}
            <div>
              <Input
                placeholder="Item Name"
                value={item.itemName || ""}
                onChange={e => onUpdate(item.id, { itemName: e.target.value })}
                className="h-9 text-sm font-medium"
                list="marine-parts-list"
              />
            </div>

            {/* Description */}
            {item.description !== undefined && (
              <Input
                placeholder="Description (optional)"
                value={item.description || ""}
                onChange={e => onUpdate(item.id, { description: e.target.value })}
                className="h-8 text-xs text-muted-foreground"
              />
            )}

            {/* Dynamic fields grid */}
            <div className="grid grid-cols-2 gap-2">
              {visibleColumns
                .filter(col => col.key !== "sno" && col.key !== "itemName" && col.key !== "total")
                .map(col => (
                  <div key={col.id} className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground pl-1">
                      {col.label}
                    </label>
                    <Input
                      type={col.type === "number" ? "number" : "text"}
                      placeholder={col.label}
                      value={getCellValue(item, col, index)}
                      onChange={e => {
                        const val = col.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
                        onUpdate(item.id, { [col.key]: val });
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onAdd();
                        }
                      }}
                      className={`h-9 text-sm ${col.type === "number" ? "text-right font-medium" : ""}`}
                    />
                  </div>
                ))}
            </div>

            {/* Total row */}
            {visibleColumns.some(c => c.key === "total") && (
              <div className="flex justify-end pt-1 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Total:</span>
                  <span className="text-sm font-black text-primary">{calculateRowTotal(item).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-xl border-2 border-dashed bg-muted/10 p-8 text-center">
            <p className="text-muted-foreground text-sm">No items yet. Click <strong>&quot;Add Row&quot;</strong> to start.</p>
          </div>
        )}
      </div>

      {/* Grand Subtotal */}
      {items.length > 0 && visibleColumns.some(c => c.key === "total") && (
        <div className="flex justify-end">
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-2.5 flex items-center gap-4">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Subtotal</span>
            <span className="text-xl font-black text-primary">
              {items.reduce((sum, item) => sum + calculateRowTotal(item), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Autocomplete */}
      <datalist id="marine-parts-list">
        {COMMON_MARINE_PARTS.map((part) => (
          <option key={part} value={part} />
        ))}
      </datalist>
    </div>
  );
}
