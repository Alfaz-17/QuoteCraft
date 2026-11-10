"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { QuotationState, LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  ArrowRight, 
  X,
  ClipboardList,
  CheckCircle2,
  Plus
} from "lucide-react";
import { mapImport } from "@/utils/importMapping";
import { useToast } from "@/components/ui/Toast";
import { DualOrbitalSpinner } from "@/components/ui/Loaders";
import { StepHeader } from "./StepHeader";

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
  const router = useRouter();
  const { isSignedIn } = useAuth();
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

    if (!isSignedIn) {
      toastError("Please sign in to extract and import RFQs.");
      router.push("/sign-in?redirect_url=/");
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

      if (res.status === 401) {
        toastError("Session expired. Please sign in to import RFQs.");
        router.push("/sign-in?redirect_url=/");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "We couldn't read this file. Try pasting the text instead.");
      }

      if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
        throw new Error("Unable to identify table items. You can paste the raw text or start with a blank quote.");
      }

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
        if (data.rfqDetails.rfqReference) {
          onUpdateDocInfo({
            reference: data.rfqDetails.rfqReference,
          });
        }
      }

      const mapped = mapImport({ columns: data.columns, rows: data.rows });
      if (mapped.items.length === 0) {
        throw new Error("No line items found. You can enter items manually.");
      }

      toastSuccess(`Extracted ${mapped.items.length} items from ${selectedFile.name}!`);
      onImportComplete(mapped.items, mapped.columns);
    } catch (err: unknown) {
      toastError((err as Error).message || "Could not read this file. Try pasting text or starting manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPastedText = async () => {
    if (!pastedText.trim()) {
      toastError("Please paste your customer's request text first.");
      return;
    }

    if (!isSignedIn) {
      toastError("Please sign in to extract and import RFQs.");
      router.push("/sign-in?redirect_url=/");
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

      if (res.status === 401) {
        toastError("Session expired. Please sign in to import RFQs.");
        router.push("/sign-in?redirect_url=/");
        return;
      }

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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 max-w-lg mx-auto w-full space-y-5 pb-12">
        {/* Step Progress & Screen Title */}
        <StepHeader
          step={1}
          title="Upload RFQ"
          subtitle="Extract products from customer enquiries."
        />

        {/* Input Mode Selector: Upload File vs Paste Text */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/70">
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                inputMode === "file"
                  ? "bg-white text-[#172033] shadow-xs"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#347A72]" />
              <span>Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                inputMode === "paste"
                  ? "bg-white text-[#172033] shadow-xs"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              <ClipboardList className="w-4 h-4 text-[#347A72]" />
              <span>Paste Text</span>
            </button>
          </div>
        </div>

        {/* Functional Upload Card (Single Clean Card) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
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
                <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center">
                  <DualOrbitalSpinner size="lg" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#172033]">{processStep}</p>
                    <p className="text-xs text-[#64748B]">
                      Extracting products and quantities ({elapsedSeconds}s)
                    </p>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isPdf ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="w-5 h-5 stroke-[2]" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 stroke-[2]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#172033] truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-[#64748B] font-medium">
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

                  <div className="flex items-center justify-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      File ready to extract
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={handleProcessFile}
                    className="w-full h-12 rounded-xl text-sm font-bold bg-[#347A72] hover:bg-[#28645E] active:scale-[0.98] text-white shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span>Extract Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center space-y-4 ${
                    isDragOver
                      ? "border-[#347A72] bg-teal-50/50"
                      : "border-slate-300 hover:border-[#347A72]/60 bg-slate-50/40 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#347A72] mx-auto flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 stroke-[2]" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[#172033]">
                      Upload your file
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#347A72] hover:bg-[#28645E] text-white text-xs font-bold transition-transform active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Browse Files</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B] pt-1">
                      PDF, Excel, DOCX • Max 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-700">
                Paste customer enquiry from WhatsApp or Email
              </Label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="e.g. Please quote urgently:&#10;1. 4 pcs Centrifugal pump MP-102&#10;2. 8 pcs Exhaust valve spindle&#10;3. 2 pcs Injector nozzle"
                className="w-full h-40 p-3.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#347A72] focus:border-transparent resize-y"
              />
              <div className="flex justify-end">
                <Button
                  disabled={isProcessing || !pastedText.trim()}
                  onClick={handleProcessPastedText}
                  className="h-11 px-5 rounded-xl font-bold text-xs sm:text-sm bg-[#347A72] hover:bg-[#28645E] text-white min-h-[44px]"
                >
                  {isProcessing ? (
                    <>
                      <DualOrbitalSpinner size="sm" className="mr-2" /> Reading text...
                    </>
                  ) : (
                    <>
                      Extract From Text <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Action: Enter items manually */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onSkipUpload}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#347A72] hover:text-[#28645E] py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Enter items manually</span>
          </button>
        </div>
      </div>
    </div>
  );
}
