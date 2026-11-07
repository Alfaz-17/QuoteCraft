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
  X,
  Lock,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { mapImport } from "@/utils/importMapping";
import { useToast } from "@/components/ui/Toast";
import { DualOrbitalSpinner } from "@/components/ui/Loaders";

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

  // Auto-generate quotation number if empty
  useEffect(() => {
    if (!state.documentInfo.number) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      onUpdateDocInfo({ number: `QT-${randomSuffix}` });
    }
  }, [state.documentInfo.number, onUpdateDocInfo]);



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
      toastError("Please choose a file or paste text.");
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

      // Automatically apply any extracted RFQ header metadata
      if (data.rfqDetails) {
        if (data.rfqDetails.customerName) {
          onUpdateClient({
            companyName: data.rfqDetails.customerName,
            name: data.rfqDetails.customerName,
          });
        }
        if (data.rfqDetails.vesselName) {
          onUpdateDocInfo({
            vessel: data.rfqDetails.vesselName,
          });
        }
        if (data.rfqDetails.rfqNumber) {
          onUpdateDocInfo({
            reference: data.rfqDetails.rfqNumber,
          });
        }
      }

      // Automatically apply any extracted RFQ header metadata
      if (data.rfqDetails) {
        if (data.rfqDetails.customerName) {
          onUpdateClient({
            companyName: data.rfqDetails.customerName,
            name: data.rfqDetails.customerName,
          });
        }
        if (data.rfqDetails.vesselName) {
          onUpdateDocInfo({
            vessel: data.rfqDetails.vesselName,
          });
        }
        if (data.rfqDetails.rfqNumber) {
          onUpdateDocInfo({
            reference: data.rfqDetails.rfqNumber,
          });
        }
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



  const isPdf = selectedFile?.name?.toLowerCase().endsWith(".pdf");
  const formattedFileSize = selectedFile
    ? selectedFile.size >= 1024 * 1024
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(selectedFile.size / 1024)} KB`
    : "";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 sm:py-7 space-y-5 max-w-xl mx-auto w-full pb-16">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-[22px] font-black text-[#0F172A] tracking-tight">
            Upload RFQ
          </h2>
          <p className="text-[13px] text-[#475569]">
            Upload your customer enquiry to extract products and line items automatically.
          </p>
        </div>

        {/* Input Mode Selector: Upload File vs Paste Text */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/70">
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                inputMode === "file"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#0F766E]" />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                inputMode === "paste"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              <ClipboardList className="w-4 h-4 text-[#0F766E]" />
              <span>Paste Text</span>
            </button>
          </div>
        </div>

        {/* ===== INSPIRATION: SIGNATURE CURVED CARD WITH TEAL BANNER ===== */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
          {/* Curved Deep Teal Header Banner */}
          <div className="bg-[#0F766E] p-5 sm:p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white text-[#0F766E] font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-100 bg-teal-800/40 px-2.5 py-0.5 rounded-full">
                    Step 1
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                  Upload RFQ
                </h3>
                <p className="text-xs text-teal-100/90 font-medium">
                  Upload your RFQ or import from file
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-800/40 text-teal-100 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-7 space-y-5">
          {inputMode === "file" ? (
            <div>
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

              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <DualOrbitalSpinner size="lg" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#0F172A]">{processStep}</p>
                    <p className="text-xs text-[#475569]">
                      Extracting part numbers and quantities ({elapsedSeconds}s)
                    </p>
                  </div>
                </div>
              ) : selectedFile ? (
                /* Selected File Preview Card (Exact Screen 2 in Mockup) */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isPdf ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="w-6 h-6 stroke-[2]" />
                        ) : (
                          <FileSpreadsheet className="w-6 h-6 stroke-[2]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-[#475569] font-medium">
                          {formattedFileSize}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      File ready to upload
                    </span>
                  </div>

                  {/* Primary Upload CTA Button */}
                  <Button
                    type="button"
                    onClick={handleProcessFile}
                    className="w-full h-12 rounded-xl text-sm font-bold bg-[#0F766E] hover:bg-[#0D6B63] active:scale-[0.98] text-white shadow-md shadow-[#0F766E]/20 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span>Upload File</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <p className="text-[11px] text-center text-[#475569] font-medium">
                    Supported formats: PDF, XLS, XLSX
                  </p>
                </div>
              ) : (
                /* Empty Upload Dropzone (Exact Screen 2 in Mockup) */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all cursor-pointer text-center space-y-4 ${
                    isDragOver
                      ? "border-[#0F766E] bg-teal-50/50 ring-4 ring-teal-500/10"
                      : "border-slate-300 hover:border-[#0F766E]/60 bg-slate-50/40 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#E0F2F1] text-[#0F766E] mx-auto flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-7 h-7 stroke-[2.2]" />
                  </div>

                  <div className="space-y-3">
                    <p className="text-base font-extrabold text-[#0F172A]">
                      Drag &amp; drop your file here
                    </p>
                    <p className="text-xs text-[#475569] font-medium">
                      or
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Browse Files</span>
                      </button>
                    </div>
                    <p className="text-xs text-[#475569] font-medium pt-1">
                      Supports PDF, Excel, DOCX • Max 10MB
                    </p>
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
                className="w-full h-44 p-3.5 rounded-xl border border-slate-300 text-base font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent resize-y"
              />
              <div className="flex justify-end">
                <Button
                  disabled={isProcessing || !pastedText.trim()}
                  onClick={handleProcessPastedText}
                  className="h-11 px-6 rounded-xl font-bold text-sm bg-[#0F766E] hover:bg-[#0D6B63] text-white min-h-[44px]"
                >
                  {isProcessing ? (
                    <>
                      <DualOrbitalSpinner size="sm" className="mr-2" /> Reading text...
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

          {/* Divider: —— OR —— */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              OR
            </span>
          </div>

          {/* Enter Manually Card */}
          <button
            type="button"
            onClick={onSkipUpload}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#0F766E] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-[#0F172A]">
                  Enter Manually
                </p>
                <p className="text-xs text-[#475569] font-medium">
                  Add items manually if needed
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Privacy Assurance */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Your files are private. Only you can view your quotations.</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
