"use client";

import React, { useState, useRef, useEffect } from "react";
import { QuotationState, LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  ArrowRight, 
  Loader2, 
  FilePlus, 
  Image as ImageIcon, 
  MessageSquare, 
  X,
  Building,
  User,
  Phone,
  Ship,
  Calendar,
  Cpu,
  ChevronDown,
  Check
} from "lucide-react";
import { mapImport } from "@/utils/importMapping";
import { useToast } from "@/components/ui/Toast";

interface Step1UploadProps {
  state: QuotationState;
  onUpdateDocInfo: (docInfo: Partial<QuotationState["documentInfo"]>) => void;
  onUpdateClient: (client: Partial<QuotationState["client"]>) => void;
  onImportComplete: (items: LineItem[], columns: TableColumn[]) => void;
  onSkipUpload: () => void;
}

export function Step1Upload({
  state,
  onUpdateDocInfo,
  onUpdateClient,
  onImportComplete,
  onSkipUpload,
}: Step1UploadProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeMode, setActiveMode] = useState<"file" | "paste">("file");

  // Client suggestions
  const [recentClients, setRecentClients] = useState<QuotationState["client"][]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showMachineSpecs, setShowMachineSpecs] = useState(
    Boolean(state.documentInfo.make || state.documentInfo.model || state.documentInfo.scope)
  );

  useEffect(() => {
    fetch("/api/clients/recent")
      .then((res) => (res.ok ? res.json() : { clients: [] }))
      .then((data) => {
        if (Array.isArray(data.clients)) {
          setRecentClients(data.clients);
        }
      })
      .catch(() => {});
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toastError("File exceeds 10MB limit. Please upload a smaller file.");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile && !pasteText.trim()) {
      toastError("Please choose a file or paste enquiry text.");
      return;
    }

    setIsProcessing(true);
    setProgressMsg("Analyzing document structure...");

    try {
      let bodyData: Record<string, unknown> = {};

      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        bodyData = {
          fileData: base64,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
        };
      } else {
        bodyData = {
          rawText: pasteText,
        };
      }

      const res = await fetch("/api/ai/import-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not process this file.");
      }

      if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
        throw new Error("Unable to identify table rows.");
      }

      const mapped = mapImport({ columns: data.columns, rows: data.rows });
      if (mapped.items.length === 0) {
        throw new Error("No line items found. You can start with a blank quote.");
      }

      const isDeterministic = data.method === "deterministic_excel";
      toastSuccess(
        isDeterministic
          ? `Extracted ${mapped.items.length} items deterministically (Instant, $0 cost)!`
          : `Extracted ${mapped.items.length} items via AI document parser!`
      );

      onImportComplete(mapped.items, mapped.columns);
    } catch (err: unknown) {
      toastError((err as Error).message || "Failed to process RFQ. Try pasting the text or start manually.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  const selectClient = (client: QuotationState["client"]) => {
    onUpdateClient({
      name: client.name || "",
      companyName: client.companyName || client.name || "",
      address: client.address || "",
      phone: client.phone || "",
      attn: client.attn || "",
    });
    setShowClientDropdown(false);
    toastSuccess("Customer details auto-filled!");
  };

  return (
    <div className="max-w-4xl mx-auto py-5 sm:py-8 px-3 sm:px-6 space-y-6 animate-in fade-in duration-300">
      {/* Title & Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Document & Customer Details
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
          Set up quotation metadata, customer information, and import your buyer's RFQ items.
        </p>
      </div>

      {/* DOCUMENT METADATA CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" /> Document Information
          </h4>

          {/* Document Type Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            {(["quotation", "rfq", "proforma"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onUpdateDocInfo({ type })}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  state.documentInfo.type === type
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {type === "proforma" ? "Proforma" : type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Quote / Ref No.</Label>
            <Input
              value={state.documentInfo.number || ""}
              onChange={(e) => onUpdateDocInfo({ number: e.target.value })}
              placeholder="QT-1001"
              className="h-10 text-xs sm:text-sm font-mono font-bold rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Issue Date</Label>
            <Input
              type="date"
              value={state.documentInfo.date || ""}
              onChange={(e) => onUpdateDocInfo({ date: e.target.value })}
              className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Valid Until</Label>
            <Input
              type="date"
              value={state.documentInfo.validUntil || ""}
              onChange={(e) => onUpdateDocInfo({ validUntil: e.target.value })}
              className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Ship className="w-3.5 h-3.5 text-primary" /> Vessel Name
            </Label>
            <Input
              value={state.documentInfo.vessel || ""}
              onChange={(e) => onUpdateDocInfo({ vessel: e.target.value })}
              placeholder="e.g. M/V Ocean Star"
              className="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Machinery Specs (Collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowMachineSpecs(!showMachineSpecs)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1"
          >
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Equipment / Machinery Specs ({showMachineSpecs ? "Hide" : "Optional"})</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMachineSpecs ? "rotate-180" : ""}`} />
          </button>

          {showMachineSpecs && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Scope of Supply</Label>
                <Input
                  value={state.documentInfo.scope || ""}
                  onChange={(e) => onUpdateDocInfo({ scope: e.target.value })}
                  placeholder="e.g. Main Engine Spares"
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Engine / Machine Make</Label>
                <Input
                  value={state.documentInfo.make || ""}
                  onChange={(e) => onUpdateDocInfo({ make: e.target.value })}
                  placeholder="e.g. MAN B&W / Wärtsilä"
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Machine Model</Label>
                <Input
                  value={state.documentInfo.model || ""}
                  onChange={(e) => onUpdateDocInfo({ model: e.target.value })}
                  placeholder="e.g. 6S50MC-C"
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER PROFILE CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-primary" /> Customer / Buyer Profile
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">Auto-fills from past quotes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Company Name with Autocomplete */}
          <div className="space-y-1 relative">
            <Label className="text-xs font-semibold text-slate-700">Customer Company</Label>
            <Input
              value={state.client.companyName || state.client.name || ""}
              onChange={(e) => {
                onUpdateClient({ companyName: e.target.value, name: e.target.value });
                setShowClientDropdown(true);
              }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="e.g. V.Ships / Anglo Eastern"
              className="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200"
            />

            {/* Recent Clients Dropdown */}
            {showClientDropdown && recentClients.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto p-1 divide-y divide-slate-100">
                <div className="p-1.5 text-[10px] font-bold uppercase text-slate-400">Previous Customers</div>
                {recentClients
                  .filter((c) => {
                    const term = (state.client.companyName || "").toLowerCase();
                    const name = (c.companyName || c.name || "").toLowerCase();
                    return !term || name.includes(term);
                  })
                  .slice(0, 5)
                  .map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 transition-colors"
                    >
                      <p className="font-bold">{c.companyName || c.name}</p>
                      {c.attn && <p className="text-[10px] text-slate-400 font-normal">Attn: {c.attn}</p>}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Contact Person (Attn)
            </Label>
            <Input
              value={state.client.attn || ""}
              onChange={(e) => onUpdateClient({ attn: e.target.value })}
              placeholder="e.g. Capt. Sharma / Tech Supdt"
              className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp / Phone
            </Label>
            <Input
              value={state.client.phone || ""}
              onChange={(e) => onUpdateClient({ phone: e.target.value })}
              placeholder="+971 50 123 4567"
              className="h-10 text-xs sm:text-sm font-mono font-bold rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Delivery Address / Port of Supply</Label>
          <Input
            value={state.client.address || ""}
            onChange={(e) => onUpdateClient({ address: e.target.value })}
            placeholder="e.g. Port of Dubai / Singapore Anchorage"
            className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* RFQ FILE IMPORT / TEXT ENTRY CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-primary" /> Import Buyer's RFQ
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Excel files are extracted deterministically with $0 cost. PDFs and text are parsed intelligently.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode("file")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeMode === "file"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>File Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("paste")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeMode === "paste"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Paste Text</span>
            </button>
          </div>
        </div>

        {activeMode === "file" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all bg-slate-50/40 ${
              isDragOver
                ? "border-primary bg-primary/5 ring-8 ring-primary/10"
                : selectedFile
                ? "border-emerald-500/80 bg-emerald-50/20"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.txt,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="h-9 px-3 rounded-xl font-semibold text-xs border-slate-200"
                  >
                    <X className="w-3.5 h-3.5 mr-1 text-slate-400" /> Change
                  </Button>
                  <Button
                    size="sm"
                    disabled={isProcessing}
                    onClick={handleProcess}
                    className="h-9 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white min-h-[40px]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        Extract Line Items <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/60 text-[11px] font-semibold text-slate-700">
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Excel (.xlsx)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/60 text-[11px] font-semibold text-slate-700">
                    <FileText className="w-3 h-3 text-red-500" /> PDF Document
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/60 text-[11px] font-semibold text-slate-700">
                    <ImageIcon className="w-3 h-3 text-blue-500" /> WhatsApp Photo
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Drag and drop enquiry spreadsheet or PDF
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    or choose a file from your device
                  </p>
                </div>

                <div>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white min-h-[44px]"
                  >
                    Browse RFQ File
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste enquiry text from WhatsApp or email:&#10;1. Piston Ring - Part No: 12345 - Qty: 4 pcs&#10;2. Cylinder Liner - Part No: 67890 - Qty: 2 pcs"
              className="w-full h-28 p-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none bg-slate-50/50"
            />
            <div className="flex justify-end">
              <Button
                disabled={!pasteText.trim() || isProcessing}
                onClick={handleProcess}
                className="h-10 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white min-h-[44px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Extract Line Items <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry or Continue Option */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onSkipUpload}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-slate-100 min-h-[40px]"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Create quote manually without file
        </button>

        <Button
          onClick={onSkipUpload}
          className="h-11 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md min-h-[44px] w-full sm:w-auto"
        >
          Continue to Items & Pricing <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Processing Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">Processing Buyer's RFQ</h4>
              <p className="text-xs text-slate-500 mt-1">{progressMsg}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
