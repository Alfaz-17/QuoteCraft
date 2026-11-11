"use client";

import React, { useState, useRef } from "react";
import { QuotationState } from "@/types/quotation.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractColorsFromImage, ExtractedPalette } from "@/utils/logoColorExtractor";
import { 
  X, Building2, UploadCloud, Check, Landmark, ShieldCheck, 
  FileText, Sparkles 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: QuotationState;
  onUpdateCompany: (company: Partial<QuotationState["company"]>) => void;
  onUpdateBranding: (branding: Partial<QuotationState["branding"]>) => void;
  onUpdateTerms: (terms: string) => void;
}

export function CompanyProfileModal({
  isOpen,
  onClose,
  state,
  onUpdateCompany,
  onUpdateBranding,
  onUpdateTerms,
}: CompanyProfileModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState(state.company);
  const [logo, setLogo] = useState<string | null>(state.branding.logo);
  const [terms, setTerms] = useState(state.terms || "");
  const [activeTab, setActiveTab] = useState<"business" | "bank" | "terms">("business");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [detectedPalette, setDetectedPalette] = useState<ExtractedPalette | null>(null);

  React.useEffect(() => {
    if (logo && !detectedPalette) {
      extractColorsFromImage(logo).then((palette) => {
        setDetectedPalette(palette);
      }).catch(() => {});
    }
  }, [logo, detectedPalette]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError("Logo size must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setLogo(result);
      try {
        const palette = await extractColorsFromImage(result);
        setDetectedPalette(palette);
      } catch (err) {
        console.warn("AI Logo color analysis fallback:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setDetectedPalette(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    onUpdateCompany(company);
    onUpdateBranding({ logo });
    onUpdateTerms(terms);

    // Persist in localStorage
    try {
      localStorage.setItem("companyProfile", JSON.stringify(company));
      localStorage.setItem("brandingProfile", JSON.stringify({ ...state.branding, logo }));
      localStorage.setItem("defaultTerms", terms);
    } catch (e) {
      console.error("Local storage save error", e);
    }

    // Persist permanently into PostgreSQL user profile
    try {
      await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          terms,
          branding: { ...state.branding, logo: null },
        }),
      });
    } catch (e) {
      console.warn("Could not sync profile modal to database:", e);
    }

    setSavedSuccess(true);
    toastSuccess("Company details saved! Used automatically for all quotes.");
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 text-[#0F766E] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Company & Bank Setup
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Set up once — all new quotations use these details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Native Segmented Sub-tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-slate-100 bg-white shrink-0">
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("business")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                activeTab === "business"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Business Info & Logo
            </button>
            <button
              onClick={() => setActiveTab("bank")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                activeTab === "bank"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bank Details
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                activeTab === "terms"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Standard Terms
            </button>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === "business" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Logo upload */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Company Logo
                </Label>
                <div className="flex items-center gap-4">
                  {logo ? (
                    <div className="relative p-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center h-16 w-32">
                      <img src={logo} alt="Company Logo" className="max-h-12 max-w-full object-contain" />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs hover:bg-rose-600"
                        title="Remove logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center h-16 w-32 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 mb-0.5 text-primary" />
                      <span className="text-xs font-semibold">Upload Logo</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="text-xs text-slate-400 font-medium">
                    <p>PNG or JPG format. Recommended 400x120px.</p>
                    <p>Placed in the header of every quotation PDF.</p>
                  </div>
                </div>
                {/* AI Detected Brand Colors */}
                {detectedPalette && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-teal-50 to-amber-50/50 border border-teal-200 text-xs shadow-2xs mt-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900">AI Logo Color Palette:</span>
                        <span className="text-slate-600 ml-2 font-mono text-[11px] font-bold">
                          {detectedPalette.primaryColor} (Primary) &amp; {detectedPalette.secondaryColor} (Accent)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateBranding({
                          primaryColor: detectedPalette.primaryColor,
                          secondaryColor: detectedPalette.secondaryColor,
                        });
                        toastSuccess(`Applied logo colors (${detectedPalette.primaryColor}) to quotation template!`);
                      }}
                      className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0D6B63] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs shrink-0"
                    >
                      Apply to Template
                    </button>
                  </div>
                )}
              </div>

              {/* Business info fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">Company Name</Label>
                  <Input
                    value={company.name || ""}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    placeholder="e.g. Apex Marine & Industrial Spares"
                    className="h-10 text-base sm:text-sm font-semibold rounded-xl"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">Office / Workshop Address</Label>
                  <Input
                    value={company.address || ""}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    placeholder="e.g. Plot 42, Port Road, Gandhidham, Gujarat 370201"
                    className="h-10 text-base sm:text-sm font-semibold rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Phone / WhatsApp</Label>
                  <Input
                    type="tel"
                    value={company.phone || ""}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="h-10 text-base sm:text-sm font-semibold rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    value={company.email || ""}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    placeholder="sales@apexmarine.com"
                    className="h-10 text-base sm:text-sm font-semibold rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">GST / Tax ID</Label>
                  <Input
                    value={company.taxId || ""}
                    onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    className="h-10 text-base sm:text-sm font-semibold rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Website</Label>
                  <Input
                    type="url"
                    value={company.website || ""}
                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    placeholder="www.apexmarine.com"
                    className="h-10 text-base sm:text-sm font-semibold rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "bank" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <Label className="text-xs font-semibold text-slate-700">
                Bank Details for Direct Payment
              </Label>
              <textarea
                value={company.bankDetails || ""}
                onChange={(e) => setCompany({ ...company, bankDetails: e.target.value })}
                placeholder="Bank: HDFC Bank&#10;A/C Name: Apex Marine Spares&#10;A/C No: 50200012345678&#10;IFSC: HDFC0001234&#10;Branch: Gandhidham"
                className="w-full h-36 p-3 text-base sm:text-sm font-mono border rounded-xl focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none resize-none bg-slate-50/50"
              />
              <p className="text-xs text-slate-400">
                Printed on the PDF quotation so buyers can pay directly to your bank account.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <Label className="text-xs font-semibold text-slate-700">
                Standard Payment & Commercial Terms
              </Label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="1. Delivery: Ex-Stock / 3-5 working days.&#10;2. Payment: 100% against proforma invoice.&#10;3. Quote Validity: 30 days from date of issue.&#10;4. Taxes: GST as applicable."
                className="w-full h-36 p-3 text-base sm:text-sm border rounded-xl focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none resize-none bg-slate-50/50"
              />
              <p className="text-xs text-slate-400">
                Automatically included in every quote. You can edit this anytime.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 px-5 rounded-xl font-semibold text-xs border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="h-11 px-6 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-md shadow-[#0F766E]/20 min-w-[130px] active:scale-[0.98]"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Saved!
              </>
            ) : (
              "Save Details"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
