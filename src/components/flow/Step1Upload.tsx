"use client";

import React, { useState, useRef } from "react";
import { QuotationState, LineItem, TableColumn } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UploadCloud, FileSpreadsheet, FileText, ArrowRight, Loader2, Sparkles, 
  FilePlus, Image as ImageIcon, MessageSquare, Check, X
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

  // File to base64 helper
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
    setProgressMsg("Reading document and structuring items...");

    try {
      let bodyData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

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
        throw new Error(data.error || "Could not process this file. Please ensure it contains items or enter them manually.");
      }

      if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
        throw new Error("Unable to identify table rows. Try copying and pasting the items directly.");
      }

      const mapped = mapImport({ columns: data.columns, rows: data.rows });
      if (mapped.items.length === 0) {
        throw new Error("No line items found. Please check the file or start a blank quote.");
      }

      toastSuccess(`Extracted ${mapped.items.length} items from buyer's file!`);
      onImportComplete(mapped.items, mapped.columns);
    } catch (err: any) {
      toastError(err.message || "Failed to process RFQ. Try pasting the text or start manually.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Title & Native Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Buyer's Enquiry
        </h2>
        <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
          Drop an Excel sheet, PDF, or photo of the enquiry. We will structure the items and columns automatically.
        </p>
      </div>

      {/* Segmented Mode Selector: File Upload vs Paste Text */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-200/60 rounded-xl border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveMode("file")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === "file"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-primary" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("paste")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === "paste"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span>Paste Message / WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Main Upload Card */}
      {activeMode === "file" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-9 text-center transition-all bg-white shadow-xs ${
            isDragOver
              ? "border-primary bg-primary/5 ring-8 ring-primary/10"
              : selectedFile
              ? "border-emerald-500/80 bg-emerald-50/20"
              : "border-slate-300/80 hover:border-slate-400"
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
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="h-10 px-4 rounded-xl font-semibold text-xs border-slate-200"
                >
                  <X className="w-3.5 h-3.5 mr-1 text-slate-400" /> Change file
                </Button>
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleProcess}
                  className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Extract items <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Native format badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Excel (.xlsx)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  <FileText className="w-3 h-3 text-red-500" /> PDF Document
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  <ImageIcon className="w-3 h-3 text-blue-500" /> WhatsApp Photo
                </span>
              </div>

              <div>
                <p className="text-base font-bold text-slate-800">
                  Drag and drop enquiry file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  or choose from your computer or phone
                </p>
              </div>

              <div>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 px-7 rounded-xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-[0.98] min-h-[44px]"
                >
                  Browse File
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Text Paste Card */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-700">
              Paste WhatsApp or Email Enquiry
            </Label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Copy the items list from your chat or email and paste it here.
            </p>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="e.g.:&#10;1. Exhaust Valve Spindle - Part No: 12345 - Qty: 6 pcs&#10;2. Valve Seat Ring - Part No: 67890 - Qty: 6 pcs"
            className="w-full h-32 p-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none bg-slate-50/50"
          />

          <div className="flex justify-end">
            <Button
              disabled={!pasteText.trim() || isProcessing}
              onClick={handleProcess}
              className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Extract items <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Enquiry Metadata Card (Native Form Feel) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Enquiry Reference
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">Optional</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Buyer Company</Label>
            <Input
              value={state.client.companyName || state.client.name || ""}
              onChange={(e) =>
                onUpdateClient({ companyName: e.target.value, name: e.target.value })
              }
              placeholder="e.g. V.Ships / Anglo Eastern"
              className="h-9 text-xs sm:text-sm font-semibold rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Vessel / Project</Label>
            <Input
              value={state.documentInfo.vessel || ""}
              onChange={(e) => onUpdateDocInfo({ vessel: e.target.value })}
              placeholder="e.g. M/V Ocean Star"
              className="h-9 text-xs sm:text-sm font-semibold rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Quote No.</Label>
            <Input
              value={state.documentInfo.number || ""}
              onChange={(e) => onUpdateDocInfo({ number: e.target.value })}
              placeholder="QT-1001"
              className="h-9 text-xs sm:text-sm font-mono font-bold rounded-xl border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Skip / Manual Entry Option */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onSkipUpload}
          className="text-xs font-bold text-slate-500 hover:text-primary transition-colors inline-flex items-center gap-1.5 py-2 px-4 rounded-xl hover:bg-slate-100 active:scale-95"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Or create blank quote manually without file →
        </button>
      </div>

      {/* Processing Modal / Overlay */}
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
