"use client";

import { LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Settings2, X, Eye, EyeOff, Copy, ChevronUp, ChevronDown, Sparkles, FileText, UploadCloud, Loader2, AlertCircle, GripVertical } from "lucide-react";
import { calculateRowTotal, getRoleKey, toNumber } from "@/utils/calculations";
import { mapImport, itemTitle } from "@/utils/importMapping";
import { COMMON_MARINE_PARTS } from "@/constants/marine-parts";
import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/Toast";

const UNIT_OPTIONS = ["pcs", "sets", "kg", "ltrs", "mtrs", "nos", "lot", "pair", "box", "roll"];

interface ItemsTableProps {
  items: LineItem[];
  tableColumns: TableColumn[];
  onUpdate: (id: string, updates: Partial<LineItem>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onAddColumn: (col: TableColumn) => void;
  onDeleteColumn: (id: string) => void;
  onUpdateColumn: (id: string, updates: Partial<TableColumn>) => void;
  onImportRfq?: (items: LineItem[], columns: TableColumn[]) => void;
  onSetColumns: (columns: TableColumn[]) => void;
  currencySymbol?: string;
}

export function ItemsTable({
  items,
  tableColumns,
  onUpdate,
  onDelete,
  onAdd,
  onDuplicate,
  onReorder,
  onAddColumn,
  onDeleteColumn,
  onUpdateColumn,
  onImportRfq,
  onSetColumns,
  currencySymbol = "$",
}: ItemsTableProps) {
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(items[0]?.id ?? null);
  
  // AI Importer States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiText, setAiText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  
  const { success, error: toastError, info: toastInfo, dismiss } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemCountRef = useRef(items.length);
  const visibleColumns = tableColumns.filter(c => c.visible);

  useEffect(() => {
    const previousCount = itemCountRef.current;
    itemCountRef.current = items.length;

    if (items.length === 0) {
      setActiveItemId(null);
      return;
    }

    if (items.length > previousCount) {
      setActiveItemId(items[items.length - 1].id);
      return;
    }
  }, [items, activeItemId]);

  const handleAddItem = () => {
    onAdd();
  };

  const handleDeleteItem = (id: string) => {
    onDelete(id);
    if (activeItemId === id) {
      setActiveItemId(null);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnLabel.trim()) return;
    const key = `x_${newColumnLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || Date.now()}`;
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

  const qtyKey = getRoleKey(tableColumns, "qty") ?? "quantity";
  const priceKey = getRoleKey(tableColumns, "price") ?? "unitPrice";

  const moveColumn = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= tableColumns.length) return;
    const next = [...tableColumns];
    [next[index], next[target]] = [next[target], next[index]];
    onSetColumns(next);
  };

  // Only one column may be the Quantity and one the Rate; they drive every total.
  const setColumnRole = (col: TableColumn, value: string) => {
    let next = tableColumns.map(c => ({ ...c }));
    if (value === "qty" || value === "price") {
      next = next.map(c => (c.role === value && c.id !== col.id ? { ...c, role: undefined } : c));
      next = next.map(c => (c.id === col.id ? { ...c, role: value, type: "number" as const } : c));
    } else {
      next = next.map(c => (c.id === col.id ? { ...c, role: undefined, type: value as "text" | "number" } : c));
    }
    onSetColumns(next);
  };

  // Convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
        const errorMsg = "The file you selected exceeds the 4MB limit. Please upload a smaller file or copy-paste the text directly.";
        setAiError(errorMsg);
        toastError("File too large. Max size is 4MB.");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setSelectedFile(file);
        setAiError("");
      }
    }
  };

  const handleRunAIImport = async () => {
    setAiError("");
    setAiLoading(true);
    let loadingToastId = "";

    try {
      let bodyData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        bodyData = {
          fileData: base64,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
        };
      } else if (aiText.trim()) {
        bodyData = {
          rawText: aiText,
        };
      } else {
        const errorMsg = "Please select a file or paste RFQ description text.";
        setAiError(errorMsg);
        toastError(errorMsg);
        setAiLoading(false);
        return;
      }

      loadingToastId = toastInfo("Analyzing RFQ with AI... Please hold.", 15000);

      const res = await fetch("/api/ai/import-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process RFQ with AI.");
      }

      if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
        throw new Error("The AI failed to format the extracted line items correctly.");
      }
      const mapped = mapImport({ columns: data.columns, rows: data.rows });
      if (mapped.items.length === 0) {
        throw new Error("No line items found in the input. Please try copy-pasting the raw text.");
      }

      if (onImportRfq) {
        if (importMode === "replace") {
          // Table takes the shape of the buyer's file
          onImportRfq(mapped.items, mapped.columns);
        } else {
          // Append: keep current columns, add any new ones just before Total
          const have = new Set(tableColumns.map(c => c.key));
          const extra = mapped.columns.filter(c => !have.has(c.key) && c.key !== "total" && c.key !== "sno");
          const totalIdx = tableColumns.findIndex(c => c.role === "total");
          const merged = [...tableColumns];
          merged.splice(totalIdx === -1 ? merged.length : totalIdx, 0, ...extra);
          onImportRfq([...items, ...mapped.items], merged);
        }
      }

      setShowAIModal(false);
      setAiText("");
      setSelectedFile(null);
      success(`Extracted ${mapped.items.length} items with ${mapped.columns.filter(c => c.type !== "auto").length} columns from the RFQ.`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during AI analysis.";
      setAiError(errMsg);
      toastError(errMsg);
    } finally {
      setAiLoading(false);
      if (loadingToastId) {
        dismiss(loadingToastId);
      }
    }
  };

  const toggleAccordion = (id: string) => {
    if (activeItemId === id) {
      setActiveItemId(null); // Collapse if already open
    } else {
      setActiveItemId(id); // Expand clicked item
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Line Items</h3>
          <p className="text-sm font-medium text-slate-500">Manage technical specifications and pricing</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnManager(!showColumnManager)}
            className="flex items-center gap-2 bg-white text-slate-700 font-bold border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl h-10 px-4 transition-all shadow-sm"
          >
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span className="hidden min-[390px]:inline">Columns</span>
          </Button>
          <Button 
            size="sm" 
            onClick={handleAddItem} 
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-95 rounded-xl h-10 px-4 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden min-[390px]:inline">Add Item</span>
          </Button>
        </div>
      </div>

      {/* Column Manager Drawer (Inline) */}
      {showColumnManager && (
        <div className="p-4 rounded-lg border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Manage Columns</p>
          <div className="space-y-2">
            {tableColumns.map((col, i) => {
              const isAuto = col.type === "auto";
              return (
                <div key={col.id} className={`flex flex-wrap items-center gap-2 p-2 rounded-xl border ${col.visible ? "bg-white border-slate-200" : "bg-slate-50 border-transparent opacity-70"}`}>
                  <button onClick={() => onUpdateColumn(col.id, { visible: !col.visible })} className="p-1.5 text-slate-500 hover:text-slate-800" title={col.visible ? "Hide column" : "Show column"}>
                    {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <Input
                    value={col.label}
                    onChange={e => onUpdateColumn(col.id, { label: e.target.value })}
                    className="h-8 text-sm font-medium flex-1 min-w-[110px] rounded-lg"
                  />
                  {isAuto ? (
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">{col.role === "total" ? "Auto total" : "Auto"}</span>
                  ) : (
                    <select
                      value={col.role ?? (col.type === "number" ? "number" : "text")}
                      onChange={e => setColumnRole(col, e.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white text-xs font-bold px-2"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="qty">Quantity</option>
                      <option value="price">Rate / Price</option>
                    </select>
                  )}
                  <button onClick={() => moveColumn(i, -1)} disabled={i === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveColumn(i, 1)} disabled={i === tableColumns.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  {col.role !== "total" && col.role !== "price" && col.key !== "sno" ? (
                    <button onClick={() => onDeleteColumn(col.id)} className="p-1 text-destructive hover:scale-110 transition-transform" title="Delete column"><X className="w-4 h-4" /></button>
                  ) : <span className="w-6" />}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 max-w-sm pt-2">
            <Input
              placeholder="Add custom column..."
              value={newColumnLabel}
              onChange={e => setNewColumnLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddColumn()}
              className="h-9 text-sm font-medium flex-1 rounded-xl"
            />
            <Button size="sm" onClick={handleAddColumn} className="h-9 font-bold rounded-xl px-5">
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-24 h-24 mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Sparkles className="w-8 h-8 text-primary/40" />
            </div>
          </div>
          <h4 className="text-xl md:text-2xl font-black text-slate-800 mb-2">No line items yet</h4>
          <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm mx-auto">
            Start building your quotation by adding manual items or using our AI importer to extract data from an RFQ file.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Button 
              size="lg" 
              onClick={handleAddItem} 
              className="w-full sm:w-auto rounded-xl shadow-md font-bold text-sm px-8"
            >
              Start adding items
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setShowAIModal(true)} 
              className="w-full sm:w-auto rounded-xl font-bold text-sm px-8 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" /> AI Importer
            </Button>
          </div>
        </div>
      )}

      {/* Accordion List */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const isActive = activeItemId === item.id;
            const rowTotal = calculateRowTotal(item, tableColumns);
            const qtyVal = toNumber(item[qtyKey]);
            const title = itemTitle(item, tableColumns);
            
            return (
              <div 
                key={item.id} 
                className={`group border rounded-lg bg-white transition-all overflow-hidden ${
                  isActive ? "border-primary/40 ring-4 ring-primary/5 shadow-md" : "border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                {/* Collapsed/Header View */}
                <div 
                  className={`px-4 py-3.5 md:py-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    isActive ? "bg-primary/5" : "hover:bg-slate-50"
                  }`}
                  onClick={() => toggleAccordion(item.id)}
                >
                  <span className="text-slate-400 font-mono text-xs font-bold tracking-widest w-6 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className={`text-sm md:text-base truncate transition-all ${isActive ? "font-black text-primary" : "font-bold text-slate-800"}`}>
                      {title || <span className="text-slate-400 italic font-medium">Unnamed Item</span>}
                    </h5>
                    {/* Mobile subtext */}
                    <p className="text-xs text-slate-500 font-medium sm:hidden truncate mt-0.5">
                      {item.partNumber && `${item.partNumber} • `} {qtyVal || 0} {item.unit || "pcs"}
                    </p>
                    {/* Desktop description snippet */}
                    <p className="hidden sm:block text-[12px] text-slate-500 font-medium truncate mt-0.5 max-w-md">
                      {item.partNumber && <span className="text-slate-700 mr-2 border border-slate-200 bg-white px-1 rounded">{item.partNumber}</span>}
                      {item.itemName ? (item.description || "No description provided") : ""}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 px-4 text-right">
                    <div className="text-left w-20">
                      <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-0.5">Qty / Unit</p>
                      <p className="text-xs font-black text-slate-700">{qtyVal || 0} <span className="text-slate-500 uppercase">{item.unit || "pcs"}</span></p>
                    </div>
                    <div className="text-right w-24">
                      <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-0.5">Total</p>
                      <p className="text-sm font-black text-slate-800">{currencySymbol}{rowTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-primary/10" : "bg-slate-100 group-hover:bg-slate-200"}`}>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isActive ? "-rotate-180 text-primary" : ""}`} />
                  </div>
                </div>

                {/* Expanded Content View */}
                {isActive && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 md:p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                      
                      {/* Fields come from the table columns, so they match whatever the RFQ had */}
                      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {visibleColumns.filter(c => c.type !== "auto").map(col => {
                          const wide = col.key === "description";
                          const isPrice = col.role === "price";
                          const raw = item[col.key];
                          return (
                            <div key={col.id} className={`space-y-1.5 min-w-0 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                {col.label}{isPrice ? ` (${currencySymbol})` : ""}
                              </label>
                              {wide ? (
                                <textarea
                                  rows={2}
                                  value={raw === undefined ? "" : String(raw)}
                                  onChange={e => onUpdate(item.id, { [col.key]: e.target.value })}
                                  className="w-full px-3 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                />
                              ) : col.type === "number" ? (
                                <Input
                                  type="number"
                                  min="0"
                                  step={isPrice ? "0.01" : "any"}
                                  value={raw === 0 || raw === undefined || raw === "" ? "" : Number(raw)}
                                  onChange={e => onUpdate(item.id, { [col.key]: parseFloat(e.target.value) || 0 })}
                                  className={`h-10 text-sm text-slate-800 bg-white border-slate-200 shadow-sm rounded-xl ${isPrice ? "font-black text-right border-primary/40" : "font-bold text-center"}`}
                                />
                              ) : (
                                <Input
                                  value={raw === undefined ? "" : String(raw)}
                                  list={col.key === "itemName" ? "marine-parts-list" : col.key === "unit" ? "unit-list" : undefined}
                                  onChange={e => onUpdate(item.id, { [col.key]: e.target.value })}
                                  className="h-10 text-sm font-medium text-slate-800 bg-white border-slate-200 shadow-sm rounded-xl focus-visible:ring-primary/20"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {visibleColumns.some(c => c.role === "total") && (
                        <div className="lg:col-span-3 pt-3 flex items-center justify-between border-t border-slate-200/60">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Row Total</p>
                          <p className="text-xl font-black text-primary">{currencySymbol}{rowTotal.toFixed(2)}</p>
                        </div>
                      )}

                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onReorder(item.id, "up")}
                          disabled={index === 0}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 disabled:opacity-30 transition-colors"
                          title="Move Up"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onReorder(item.id, "down")}
                          disabled={index === items.length - 1}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 disabled:opacity-30 transition-colors"
                          title="Move Down"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDuplicate(item.id)}
                          className="p-2 ml-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors flex items-center justify-center"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex items-center gap-2 px-3 py-2 text-[12px] font-bold text-destructive hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Remove Item</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Buttons at bottom (visible when items > 0) */}
      {items.length > 0 && (
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={handleAddItem} 
            className="flex-1 gap-2 rounded-lg border-dashed border-2 bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary shadow-none h-14 font-black text-sm transition-all"
          >
            <Plus className="w-5 h-5" /> Add Another Part
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAIModal(true)} 
            className="gap-2 rounded-lg border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 shadow-sm h-14 px-5 font-bold transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> 
            <span className="hidden min-[390px]:inline">AI Import</span>
          </Button>
        </div>
      )}

      {/* AI Modal remains mostly the same but nicely styled */}
      {showAIModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-slate-800">AI Smart Importer</h4>
                  <p className="text-xs text-slate-500 font-medium">Extract line items from any technical document</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setAiError("");
                  setSelectedFile(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ScrollArea className="flex-1 max-h-[60vh] p-6 md:p-8">
              <div className="space-y-6">
                {aiError && (
                  <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {aiError}
                  </div>
                )}

                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button onClick={() => setImportMode("replace")} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${importMode === "replace" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Replace All</button>
                  <button onClick={() => setImportMode("append")} className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${importMode === "append" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Append</button>
                </div>

                {!selectedFile ? (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 md:p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*,text/plain,text/csv,.csv,.xlsx" className="hidden" />
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-sm text-slate-800">Click or drag RFQ file</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">PDF, Excel (.xlsx), CSV, PNG, JPG, TXT (Max 4MB)</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-white px-4 text-slate-400 font-bold uppercase tracking-widest">Or paste text</span></div>
                    </div>

                    <textarea
                      placeholder="e.g. 5x cylinder liner seals, oem wartsila parts, model 6L20..."
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      className="w-full h-24 p-4 text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-slate-50/50"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/50 rounded-[2rem] p-8 md:p-10 flex flex-col items-center justify-center gap-4 bg-primary/5 cursor-pointer"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*,text/plain,text/csv,.csv,.xlsx" className="hidden" />
                    <UploadCloud className="w-12 h-12 text-primary mb-2" />
                    <div className="text-center space-y-1">
                      <p className="font-black text-sm text-slate-800">{selectedFile.name}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setShowAIModal(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button
                disabled={aiLoading}
                onClick={handleRunAIImport}
                className="rounded-xl font-black px-8 h-12 bg-primary hover:brightness-110 shadow-lg shadow-primary/20 gap-2 text-sm"
              >
                {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Document...</> : <><Sparkles className="w-4 h-4" /> Start AI Analysis</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      <datalist id="unit-list">
        {UNIT_OPTIONS.map(u => <option key={u} value={u} />)}
      </datalist>

      {/* Autocomplete */}
      <datalist id="marine-parts-list">
        {COMMON_MARINE_PARTS.map((part) => (
          <option key={part} value={part} />
        ))}
      </datalist>
    </div>
  );
}
