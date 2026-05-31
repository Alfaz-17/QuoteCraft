"use client";

import { LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings2, X, Eye, EyeOff, Copy, ChevronUp, ChevronDown, Sparkles, FileText, UploadCloud, Loader2, AlertCircle, Pencil, Check } from "lucide-react";
import { calculateRowTotal } from "@/utils/calculations";
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
  onImportItems?: (items: LineItem[]) => void;
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
  onImportItems,
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

    if (!activeItemId || !items.some(item => item.id === activeItemId)) {
      setActiveItemId(items[items.length - 1].id);
    }
  }, [items, activeItemId]);

  const handleAddItem = () => {
    onAdd();
  };

  const handleDeleteItem = (id: string) => {
    onDelete(id);
    if (activeItemId === id) {
      const nextItem = items.find(item => item.id !== id);
      setActiveItemId(nextItem?.id ?? null);
    }
  };

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

      loadingToastId = toastInfo("Analyzing RFQ with Gemini AI... Please hold.", 15000);

      const res = await fetch("/api/ai/import-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process RFQ with AI.");
      }

      if (data.items && Array.isArray(data.items)) {
        if (data.items.length === 0) {
          throw new Error("No structured marine parts found in the input. Please try copy-pasting the raw text.");
        }

        // Map elements to ensure unique IDs
        const formattedItems = data.items.map((item: any, idx: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: (Date.now() + idx).toString(),
          itemName: item.itemName || "Exhaust Spares",
          description: item.description || "",
          partNumber: item.partNumber || "",
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit || "pcs",
          condition: item.condition || "",
          unitPrice: parseFloat(item.unitPrice) || 0,
        }));

        if (onImportItems) {
          if (importMode === "replace") {
            onImportItems(formattedItems);
          } else {
            onImportItems([...items, ...formattedItems]);
          }
        }
        
        // Success -> close modal
        setShowAIModal(false);
        setAiText("");
        setSelectedFile(null);
        success(`Successfully extracted ${formattedItems.length} marine line items!`);
      } else {
        throw new Error("The AI failed to format the extracted line items correctly.");
      }
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred during AI analysis.";
      setAiError(errMsg);
      toastError(errMsg);
    } finally {
      setAiLoading(false);
      if (loadingToastId) {
        dismiss(loadingToastId);
      }
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Parts List</h3>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowColumnManager(!showColumnManager)}
            className={`gap-1 rounded-lg md:rounded-full text-[11px] h-8 px-2.5 md:px-3 ${showColumnManager ? "bg-primary/10 text-primary" : ""}`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden min-[390px]:inline">Columns</span>
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
                <button
                  onClick={() => onUpdateColumn(col.id, { visible: !col.visible })}
                  className="hover:scale-110 transition-transform"
                >
                  {col.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                </button>
                <span>{col.label}</span>
                {col.id.startsWith("custom_") && (
                  <button
                    onClick={() => onDeleteColumn(col.id)}
                    className="text-destructive hover:scale-115 transition-transform ml-1 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 max-w-xs pt-1">
            <Input
              placeholder="Add custom column..."
              value={newColumnLabel}
              onChange={e => setNewColumnLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddColumn()}
              className="h-8 text-xs flex-1"
            />
            <Button size="sm" onClick={handleAddColumn} className="h-8 text-xs font-bold rounded-full">
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-2.5 md:space-y-3">
        {items.length > 0 && (
          <div className="rounded-xl border bg-slate-50/50 p-2 shadow-sm">
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Line Items
              </p>
            </div>
            <div className="space-y-1.5">
              {items.map((item, index) => {
                const isActive = activeItemId === item.id;
                const rowTotal = calculateRowTotal(item);

                if (!isActive) {
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveItemId(item.id)}
                      className="group flex items-center gap-3 rounded-xl border bg-white hover:border-primary/30 hover:bg-slate-50 px-3 py-2.5 cursor-pointer transition-all shadow-sm"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <span className="block truncate text-sm font-bold text-slate-800">
                          {item.itemName || <span className="text-slate-400 italic">Unnamed Part</span>}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            Qty: {item.quantity || 0} {item.unit || "pcs"}
                          </span>
                          <span className="text-[11px] font-bold text-primary">
                            {currencySymbol}{rowTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-primary transition-colors -rotate-90" />
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border-2 border-primary/40 bg-white p-3 md:p-4 shadow-md space-y-3 md:space-y-4 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-start justify-between gap-2 border-b pb-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                          <Pencil className="w-3 h-3" /> Editing Item {index + 1}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-xs font-black text-primary">
                        {currencySymbol}{rowTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Primary Name Field */}
                    {visibleColumns.some(c => c.key === "itemName") && (
                      <div className="space-y-1 min-w-0">
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-600 pl-1">
                          Item Name
                        </label>
                        <Input
                          placeholder="e.g. Cylinder liner seals"
                          value={item.itemName || ""}
                          list="marine-parts-list"
                          onChange={e => onUpdate(item.id, { itemName: e.target.value })}
                          className="h-10 text-sm font-medium text-slate-800"
                        />
                      </div>
                    )}

                    {/* Dynamic fields grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {visibleColumns
                        .filter(col => col.key !== "sno" && col.key !== "itemName" && col.key !== "total" && col.key !== "unit")
                        .map(col => (
                          <div key={col.id} className="space-y-0.5 min-w-0">
                            <label className="text-[11px] font-black uppercase tracking-wide text-slate-600 pl-1">
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
                                  setActiveItemId(null);
                                }
                              }}
                              className={`h-9 text-sm ${col.type === "number" ? "text-right font-medium" : ""}`}
                            />
                          </div>
                        ))}

                      {/* Unit dropdown — special handling */}
                      {visibleColumns.some(c => c.key === "unit") && (
                        <div className="space-y-0.5 min-w-0">
                          <label className="text-[11px] font-black uppercase tracking-wide text-slate-600 pl-1">
                            Unit
                          </label>
                          <Select value={item.unit || "pcs"} onValueChange={(v) => onUpdate(item.id, { unit: v })}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map(u => (
                                <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onReorder(item.id, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReorder(item.id, "down")}
                          disabled={index === items.length - 1}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicate(item.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors ml-1"
                          title="Duplicate Row"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-destructive transition-colors ml-1"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <Button size="sm" onClick={() => setActiveItemId(null)} className="rounded-full px-5 font-bold shadow-sm">
                        <Check className="w-4 h-4 mr-1.5" /> Done
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed bg-slate-50/50 p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Your parts list is empty.</p>
            <div className="flex items-center justify-center flex-wrap gap-2 mt-2">
              <Button onClick={handleAddItem} className="gap-1.5 rounded-full shadow-sm font-bold">
                <Plus className="w-4 h-4" /> Add Your First Part
              </Button>
              <Button variant="outline" onClick={() => setShowAIModal(true)} className="gap-1.5 rounded-full font-bold text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500" /> AI Import
              </Button>
            </div>
          </div>
        )}
        
        {/* Bottom Actions - Always visible when items exist */}
        {items.length > 0 && (
          <div className="flex gap-2 pt-1 pb-2">
            <Button 
              onClick={handleAddItem} 
              className="flex-1 gap-1.5 rounded-xl border-dashed border-2 bg-white text-primary border-primary/30 hover:border-primary/60 hover:bg-primary/5 shadow-sm h-12 font-bold text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Another Part
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAIModal(true)} 
              className="gap-1.5 rounded-xl border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 shadow-sm h-12 px-4 font-bold transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-500" /> 
              <span className="hidden min-[390px]:inline">AI Import</span>
            </Button>
          </div>
        )}
      </div>

      {/* Grand Subtotal */}
      {items.length > 0 && visibleColumns.some(c => c.key === "total") && (
        <div className="flex justify-end">
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-2.5 flex items-center gap-4">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Subtotal</span>
            <span className="text-xl font-black text-primary">
              {currencySymbol}{items.reduce((sum, item) => sum + calculateRowTotal(item), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ===== AI RFQ IMPORTER MODAL ===== */}
      {showAIModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b bg-gradient-to-r from-amber-500/5 to-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">AI RFQ Document Importer</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold">Gemini 2.5 Flash Document Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setAiError("");
                  setSelectedFile(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <ScrollArea className="flex-1 max-h-[60vh] p-5">
              <div className="space-y-4">
                {aiError && (
                  <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {aiError}
                  </div>
                )}

                {/* Import Mode Option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Import Method</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg border">
                    <button
                      onClick={() => setImportMode("replace")}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                        importMode === "replace" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-slate-700"
                      }`}
                    >
                      Replace Current Rows
                    </button>
                    <button
                      onClick={() => setImportMode("append")}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                        importMode === "append" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-slate-700"
                      }`}
                    >
                      Append to Table
                    </button>
                  </div>
                </div>

                {/* File Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select RFQ File</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      selectedFile ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf,image/*,text/plain"
                      className="hidden"
                    />
                    <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${selectedFile ? "text-primary" : "text-slate-400"}`} />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-700">Drag & drop or <span className="text-primary font-bold">browse</span> files</p>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase">Supports PDF, PNG, JPG, or TXT</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Paste Fallback */}
                {!selectedFile && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Or Copy-Paste RFQ Text</label>
                      {aiText && (
                        <button onClick={() => setAiText("")} className="text-[10px] text-destructive font-bold hover:underline">
                          Clear
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="e.g. 5x cylinder liner seals, oem wartsila parts, model 6L20, maker wartsila..."
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      className="w-full h-24 p-3 text-xs border rounded-xl outline-none focus:ring-1 focus:ring-primary resize-none bg-slate-50/20 font-medium"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-slate-50 flex items-center justify-between shrink-0">
              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Dual input support (File or Text)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAIModal(false);
                    setAiError("");
                    setSelectedFile(null);
                  }}
                  className="h-8 text-xs font-bold rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={aiLoading}
                  onClick={handleRunAIImport}
                  className="h-8 text-xs font-bold rounded-full shadow-md shadow-primary/10 gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-none text-white"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                      Run AI Import
                    </>
                  )}
                </Button>
              </div>
            </div>
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
