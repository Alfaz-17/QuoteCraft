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
  Sparkles,
  Building,
  Ship,
  ChevronDown,
  X,
  Lock,
  ClipboardList
} from "lucide-react";
import { mapImport } from "@/utils/importMapping";
import { useToast } from "@/components/ui/Toast";

// Demo RFQ items (M/V Oceanic Star Engine Spares)
const DEMO_ITEMS: LineItem[] = [
  {
    id: "item_demo_1",
    sno: 1,
    itemName: "Cylinder liner",
    partNumber: "CL-102",
    description: "Main Engine cylinder liner, standard bore size",
    technicalSpecification: "Bore 500mm, Stroke 2000mm, High-tensile cast iron",
    quantity: 4,
    unit: "PCS",
    unitPrice: 100,
    total: 400,
    condition: "New",
  },
  {
    id: "item_demo_2",
    sno: 2,
    itemName: "Exhaust valve spindle",
    partNumber: "EV-204",
    description: "Nimonic material exhaust valve spindle",
    technicalSpecification: "Standard length, hard chrome plated stem",
    quantity: 8,
    unit: "PCS",
    unitPrice: 10,
    total: 80,
    condition: "OEM",
  },
  {
    id: "item_demo_3",
    sno: 3,
    itemName: "Fuel injector complete",
    partNumber: "FI-301",
    description: "Complete slide fuel valve with nozzle",
    technicalSpecification: "Pressure calibrated to 380 bar, tested",
    quantity: 2,
    unit: "PCS",
    unitPrice: 40,
    total: 80,
    condition: "Reconditioned",
    needsReview: true,
  },
  {
    id: "item_demo_4",
    sno: 4,
    itemName: "Piston ring set",
    partNumber: "PRS-410",
    description: "Top and intermediate ring set per cylinder",
    technicalSpecification: "Chrome ceramic coated, CPR ring profile",
    quantity: 6,
    unit: "SETS",
    unitPrice: 20,
    total: 120,
    condition: "New",
  },
  {
    id: "item_demo_5",
    sno: 5,
    itemName: "Fuel pump plunger",
    partNumber: "FPP-515",
    description: "Plunger and barrel assembly",
    technicalSpecification: "Matched pair, micro-finished clearance",
    quantity: 3,
    unit: "PCS",
    unitPrice: 50,
    total: 150,
    condition: "New",
  },
];

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

  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState("Reading file...");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDocDetails, setShowDocDetails] = useState(false);
  const [recentClients, setRecentClients] = useState<QuotationState["client"][]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Auto-generate quotation number if empty
  useEffect(() => {
    if (!state.documentInfo.number) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      onUpdateDocInfo({ number: `QT-${randomSuffix}` });
    }
  }, [state.documentInfo.number, onUpdateDocInfo]);

  // Load recent clients for autocomplete
  useEffect(() => {
    async function loadRecentClients() {
      try {
        const res = await fetch("/api/clients/recent");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.clients)) {
            setRecentClients(data.clients);
          }
        }
      } catch (err) {
        console.warn("Could not fetch recent clients:", err);
      }
    }
    loadRecentClients();
  }, []);

  // Elapsed timer during processing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((sec) => {
          if (sec === 1) setProcessStep("Finding item rows...");
          if (sec === 3) setProcessStep("Checking part numbers & quantities...");
          if (sec === 5) setProcessStep("Finalizing line items...");
          return sec + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv", ".pdf", ".png", ".jpg", ".jpeg"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(ext)) {
      toastError("Please upload an Excel spreadsheet, CSV, PDF, or image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError("File size exceeds 10MB. Please upload a smaller file or paste text.");
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

  const handleProcessFile = async () => {
    if (!selectedFile) {
      toastError("Please choose a file or try sample data.");
      return;
    }

    setIsProcessing(true);
    setProcessStep("Reading file...");

    try {
      const base64 = await fileToBase64(selectedFile);
      const res = await fetch("/api/ai/import-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "We couldn't read this file. Try pasting the text instead.");
      }

      if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
        throw new Error("Unable to identify table items. You can paste the raw text or start with a blank quote.");
      }

      const mapped = mapImport({ columns: data.columns, rows: data.rows });
      if (mapped.items.length === 0) {
        throw new Error("No line items found. You can start with a blank quote or paste text directly.");
      }

      const isDeterministic = data.method === "deterministic_excel";
      toastSuccess(
        isDeterministic
          ? `Found ${mapped.items.length} items from spreadsheet!`
          : `Found ${mapped.items.length} items from document!`
      );

      onImportComplete(mapped.items, mapped.columns);
    } catch (err: unknown) {
      toastError((err as Error).message || "Could not read this file. Try pasting the text instead.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPastedText = async () => {
    if (!pastedText.trim()) {
      toastError("Please paste your customer's request text first.");
      return;
    }

    setIsProcessing(true);
    setProcessStep("Reading pasted text...");

    try {
      const res = await fetch("/api/ai/import-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: pastedText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not extract items from the pasted text.");
      }

      const mapped = mapImport({ columns: data.columns, rows: data.rows });
      if (mapped.items.length === 0) {
        throw new Error("No line items recognized. You can enter items manually.");
      }

      toastSuccess(`Extracted ${mapped.items.length} items from text!`);
      onImportComplete(mapped.items, mapped.columns);
    } catch (err: unknown) {
      toastError((err as Error).message || "Could not read this text. Try starting manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDemoRFQ = () => {
    onUpdateClient({
      name: "Oceanic Shipping Co.",
      companyName: "Oceanic Shipping Co.",
      address: "123 Marine Street, Dubai, UAE",
      phone: "+971 50 123 4567",
      attn: "Technical Superintendent",
    });
    onUpdateDocInfo({
      number: "QT-1075",
      vessel: "M/V Oceanic Star",
      scope: "Main Engine Spares",
      make: "MAN B&W",
      model: "6S50MC-C",
    });
    onImportComplete(DEMO_ITEMS, state.tableColumns);
    toastSuccess("Sample RFQ loaded: 5 items for M/V Oceanic Star!");
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
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
      {/* Title & One Primary Focus */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Customer&apos;s Request (RFQ)
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Upload your buyer&apos;s spreadsheet, PDF, or paste their WhatsApp/email requisition to extract items automatically.
        </p>
      </div>

      {/* Input Mode Selector: Upload File vs Paste Text */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/70">
          <button
            type="button"
            onClick={() => setInputMode("file")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[38px] ${
              inputMode === "file"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-4 h-4 text-brand-600" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode("paste")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[38px] ${
              inputMode === "paste"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="w-4 h-4 text-brand-600" />
            <span>Paste Text</span>
          </button>
        </div>
      </div>

      {/* Main Ingestion Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-5">
        {inputMode === "file" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!selectedFile) fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 transition-all cursor-pointer text-center ${
              isDragOver
                ? "border-brand-600 bg-teal-50/50 ring-4 ring-teal-500/10"
                : selectedFile
                ? "border-emerald-500 bg-emerald-50/30"
                : "border-slate-300 hover:border-brand-600/60 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <div>
                  <p className="text-base font-bold text-slate-900 truncate max-w-sm mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to read
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="h-10 px-4 rounded-lg text-xs font-semibold border-slate-300 text-slate-700"
                  >
                    <X className="w-4 h-4 mr-1 text-slate-500" /> Change File
                  </Button>

                  <Button
                    size="sm"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProcessFile();
                    }}
                    className="h-10 px-6 rounded-lg font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white min-h-[44px] shadow-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading...
                      </>
                    ) : (
                      <>
                        Read File <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="w-14 h-14 rounded-full bg-teal-50 text-brand-600 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-7 h-7 stroke-[2.2]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Drop your customer&apos;s RFQ here
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Excel, PDF, scanned image, or CSV
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel (.xlsx)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                    <FileText className="w-3.5 h-3.5 text-rose-600" /> PDF Document
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 px-6 rounded-lg font-bold text-xs sm:text-sm border-brand-600 text-brand-600 hover:bg-teal-50 min-h-[44px]"
                  >
                    Browse from computer
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700">
              Paste requisition text from WhatsApp or Email
            </Label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. Please quote urgently for M/V Oceanic Star:&#10;1. 4 pcs Cylinder liner CL-102&#10;2. 8 pcs Exhaust valve spindle EV-204&#10;3. 2 pcs Fuel valve nozzle"
              className="w-full h-44 p-3.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-y"
            />
            <div className="flex justify-end">
              <Button
                disabled={isProcessing || !pastedText.trim()}
                onClick={handleProcessPastedText}
                className="h-10 px-6 rounded-lg font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white min-h-[44px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading text...
                  </>
                ) : (
                  <>
                    Read Text <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 1-Click Try Sample Bar */}
        <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center shrink-0 font-bold">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Want to see how it works first?
              </p>
              <p className="text-xs text-slate-600">
                Load our sample marine engine requisition (M/V Oceanic Star).
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleLoadDemoRFQ}
            className="h-9 px-3.5 rounded-lg text-xs font-bold bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 shrink-0 shadow-2xs"
          >
            Try sample request
          </Button>
        </div>

        {/* Privacy Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Your files are private. Only you can view your quotations.</span>
        </div>
      </div>

      {/* Optional Details (Customer, Vessel, Quote No) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              Quotation & Customer Details (Optional)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowDocDetails(!showDocDetails)}
            className="text-xs sm:text-sm font-bold text-brand-600 hover:underline flex items-center gap-1 min-h-[36px] px-2"
          >
            <span>{showDocDetails ? "Hide" : "Add details now"}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDocDetails ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showDocDetails && (
          <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Quotation No.</Label>
                <Input
                  value={state.documentInfo.number || ""}
                  onChange={(e) => onUpdateDocInfo({ number: e.target.value })}
                  placeholder="QT-1075"
                  className="h-10 text-sm font-mono font-bold rounded-lg border-slate-300"
                />
              </div>

              <div className="space-y-1 relative">
                <Label className="text-xs font-semibold text-slate-700">Customer Company</Label>
                <Input
                  value={state.client.companyName || state.client.name || ""}
                  onChange={(e) => {
                    onUpdateClient({ companyName: e.target.value, name: e.target.value });
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="e.g. Oceanic Shipping Co."
                  className="h-10 text-sm font-semibold rounded-lg border-slate-300"
                />

                {showClientDropdown && recentClients.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto p-1 divide-y divide-slate-100">
                    <div className="p-1.5 text-xs font-bold text-slate-500">Recent Customers</div>
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
                          {c.attn && <p className="text-xs text-slate-500 font-normal">Attn: {c.attn}</p>}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Ship className="w-3.5 h-3.5 text-brand-600" /> Vessel Name
                </Label>
                <Input
                  value={state.documentInfo.vessel || ""}
                  onChange={(e) => onUpdateDocInfo({ vessel: e.target.value })}
                  placeholder="e.g. M/V Oceanic Star"
                  className="h-10 text-sm font-semibold rounded-lg border-slate-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry or Skip to Items */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onSkipUpload}
          className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-slate-100 min-h-[44px]"
        >
          <FilePlus className="w-4 h-4 text-slate-500" />
          <span>Start with blank quotation</span>
        </button>

        <Button
          onClick={onSkipUpload}
          className="h-11 px-6 rounded-lg font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white min-h-[44px] w-full sm:w-auto"
        >
          <span>Continue to Items</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      {/* Stepped Progress Modal */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-brand-600 mx-auto flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-slate-900">Reading Customer RFQ</h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">{processStep}</p>
              <p className="text-xs text-slate-400">{elapsedSeconds}s elapsed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
