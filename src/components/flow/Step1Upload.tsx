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
  Lightbulb,
  Building,
  Ship,
  ChevronDown,
  X,
  Sparkles
} from "lucide-react";
import { mapImport } from "@/utils/importMapping";
import { useToast } from "@/components/ui/Toast";

// Demo RFQ items matching the reference mockup
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Client suggestions
  const [recentClients, setRecentClients] = useState<QuotationState["client"][]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showDocDetails, setShowDocDetails] = useState(false);

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
    if (!selectedFile) {
      toastError("Please choose a file or use demo data.");
      return;
    }

    setIsProcessing(true);
    setProgressMsg("Analyzing document structure & line items...");

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
      toastError((err as Error).message || "Failed to process RFQ. Try another file or start manually.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
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
    toastSuccess("Demo RFQ loaded with 5 sample items & vessel details!");
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
      {/* Title */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Upload Customer Request
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
          Drag and drop your buyer&apos;s RFQ spreadsheet or PDF document to automatically extract line items.
        </p>
      </div>

      {/* Screen 2 Dropzone Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-6 text-center">
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
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 transition-all cursor-pointer ${
            isDragOver
              ? "border-[#0F766E] bg-[#E0F2F1]/30 ring-8 ring-[#0F766E]/10"
              : selectedFile
              ? "border-emerald-500 bg-emerald-50/20"
              : "border-slate-200 hover:border-[#0F766E]/50 bg-slate-50/40 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {selectedFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <div>
                <p className="text-base font-black text-slate-900 truncate max-w-sm mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB • File attached
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
                  className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5 mr-1 text-slate-400" /> Change File
                </Button>

                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcess();
                  }}
                  className="h-9 px-6 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#115E59] text-white min-h-[40px] shadow-md shadow-[#0F766E]/20"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Extracting...
                    </>
                  ) : (
                    <>
                      Extract Items <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cloud upload icon with teal circle */}
              <div className="w-16 h-16 rounded-full bg-[#E0F2F1] text-[#0F766E] mx-auto flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Upload Customer Request
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Drag & drop your Excel or PDF file here or click to browse
                </p>
              </div>

              {/* Badges: PDF & Excel */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-rose-50 border border-rose-200/70 text-rose-600 text-xs font-bold">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200/70 text-emerald-600 text-xs font-bold">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </span>
              </div>

              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">
                — OR —
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-6 rounded-xl font-bold text-xs border-[#0F766E] text-[#0F766E] hover:bg-[#E0F2F1] min-h-[40px]"
                >
                  Choose File
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Screen 2 Demo RFQ Tip Box (Gold & Cream) */}
        <div className="rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Need a template?
              </p>
              <p className="text-[11px] text-slate-500">
                Try out our sample marine engine RFQ with real part numbers and specifications.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleLoadDemoRFQ}
            className="h-8 px-3 rounded-lg text-xs font-bold bg-white text-[#0F766E] border border-teal-200 hover:bg-[#E0F2F1] shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
            Load Demo RFQ
          </Button>
        </div>
      </div>

      {/* Optional Document & Customer Details Dropdown / Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#0F766E]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quotation & Customer Details (Optional Now)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowDocDetails(!showDocDetails)}
            className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1"
          >
            <span>{showDocDetails ? "Hide Details" : "Edit Customer & Ref"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDocDetails ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showDocDetails && (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Quote / Ref No.</Label>
                <Input
                  value={state.documentInfo.number || ""}
                  onChange={(e) => onUpdateDocInfo({ number: e.target.value })}
                  placeholder="QT-1075"
                  className="h-10 text-xs sm:text-sm font-mono font-bold rounded-xl border-slate-200"
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
                  className="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200"
                />

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
                  <Ship className="w-3.5 h-3.5 text-[#0F766E]" /> Vessel Name
                </Label>
                <Input
                  value={state.documentInfo.vessel || ""}
                  onChange={(e) => onUpdateDocInfo({ vessel: e.target.value })}
                  placeholder="e.g. M/V Oceanic Star"
                  className="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry or Skip Option */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onSkipUpload}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-slate-100 min-h-[40px]"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Start with blank quotation
        </button>

        <Button
          onClick={onSkipUpload}
          className="h-11 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md min-h-[44px] w-full sm:w-auto"
        >
          Continue to Items <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Processing Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2F1] text-[#0F766E] mx-auto flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">Processing Buyer&apos;s RFQ</h4>
              <p className="text-xs text-slate-500 mt-1">{progressMsg}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
