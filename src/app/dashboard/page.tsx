"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  ArrowRight, 
  Download, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus, 
  Bell,
  Trash2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Currency, LineItem, TableColumn, QuotationState, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { DualOrbitalSpinner, HeroSailingLoader } from "@/components/ui/Loaders";
import { useToast } from "@/components/ui/Toast";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { calculateSubtotal, calculateGrandTotal } from "@/utils/calculations";

interface QuotationRecord {
  id: string;
  number: string;
  type: string;
  date: string;
  validUntil: string;
  vessel: string | null;
  reference: string | null;
  scope: string | null;
  make: string | null;
  model: string | null;
  company: QuotationState["company"];
  client: QuotationState["client"];
  items: LineItem[];
  tableColumns?: TableColumn[];
  terms: string | null;
  currency: Currency;
  discount: number;
  discountType: "flat" | "percent";
  taxPercent: number;
  shippingCharge: number;
  createdAt: string;
  updatedAt: string;
}

function getSavedPdfBranding(): QuotationState["branding"] {
  const defaults: QuotationState["branding"] = {
    logo: null,
    primaryColor: "#0F766E",
    secondaryColor: "#F59E0B",
    textColor: "#0F172A",
    font: "Manrope",
    layout: "marine",
  };
  try {
    const saved = localStorage.getItem("brandingProfile");
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch {
    return defaults;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { success: toastSuccess, error: toastError } = useToast();

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteQuoteTarget, setDeleteQuoteTarget] = useState<QuotationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteQuotation = async () => {
    if (!deleteQuoteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${deleteQuoteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete quotation");
      }
      setQuotations((prev) => prev.filter((q) => q.id !== deleteQuoteTarget.id));
      toastSuccess(`Quotation ${deleteQuoteTarget.number} deleted successfully.`);
      setDeleteQuoteTarget(null);
    } catch (err: unknown) {
      console.error("Delete error:", err);
      toastError(err instanceof Error ? err.message : "Failed to delete quotation.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotations?limit=10");
      if (!res.ok) throw new Error("Failed to load quotations");
      const data = await res.json();
      setQuotations(data.quotations || []);
    } catch (err: unknown) {
      console.error(err);
      toastError("Could not load recent quotations.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.replace("/sign-in");
      } else {
        // Verify if user has completed company onboarding
        (async () => {
          try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
              const data = await res.json();
              if (!data?.profile?.company?.name) {
                router.replace("/onboarding");
                return;
              }
            }
          } catch {
            // continue gracefully if offline
          }
          fetchQuotations();
        })();
      }
    }
  }, [isLoaded, isSignedIn, router, fetchQuotations]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <HeroSailingLoader statusMessage="Verifying authorization..." />
      </div>
    );
  }

  const handleDownloadPDF = async (quote: QuotationRecord) => {
    setDownloadingId(quote.id);
    try {
      const pdfState: QuotationState = {
        branding: getSavedPdfBranding(),
        documentInfo: {
          type: (quote.type as "quotation" | "rfq" | "proforma") || "quotation",
          number: quote.number,
          date: quote.date,
          validUntil: quote.validUntil,
          vessel: quote.vessel || "",
          reference: quote.reference || "",
          scope: quote.scope || "",
          make: quote.make || "",
          model: quote.model || "",
        },
        company: quote.company || { name: "", address: "", phone: "", email: "" },
        client: quote.client || { name: "", address: "" },
        items: quote.items || [],
        tableColumns: quote.tableColumns || [
          { id: "sno", label: "S.No", key: "sno", type: "auto", visible: true, width: "50px" },
          { id: "name", label: "Item Name", key: "itemName", type: "text", visible: true },
          { id: "partNumber", label: "Part No.", key: "partNumber", type: "text", visible: true, width: "110px" },
          { id: "qty", label: "Qty", key: "quantity", type: "number", role: "qty", visible: true, width: "70px" },
          { id: "unit", label: "Unit", key: "unit", type: "text", visible: true, width: "70px" },
          { id: "rate", label: "Unit Price", key: "unitPrice", type: "number", role: "price", visible: true, width: "90px" },
          { id: "total", label: "Total", key: "total", type: "auto", role: "total", visible: true, width: "90px" },
        ],
        terms: quote.terms || "",
        currency: quote.currency || "USD",
        discount: quote.discount || 0,
        discountType: quote.discountType || "flat",
        taxPercent: quote.taxPercent || 0,
        shippingCharge: quote.shippingCharge || 0,
        builderConfig: {
          showBusinessProfile: true,
          showClientInfo: true,
          showTerms: true,
          showTable: true,
          showMachineInfo: true,
        },
      };

      await generateProfessionalPDF(pdfState);
      toastSuccess(`PDF downloaded for ${quote.number}!`);
    } catch (err: unknown) {
      console.error(err);
      toastError("Failed to generate PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenInBuilder = (quote: QuotationRecord) => {
    try {
      const fullDraft: Partial<QuotationState> = {
        quotationId: quote.id,
        tableColumns: quote.tableColumns,
        documentInfo: {
          type: (quote.type as "quotation" | "rfq" | "proforma") || "quotation",
          number: quote.number,
          date: quote.date,
          validUntil: quote.validUntil,
          vessel: quote.vessel || "",
          reference: quote.reference || "",
          scope: quote.scope || "",
          make: quote.make || "",
          model: quote.model || "",
        },
        company: quote.company,
        client: quote.client,
        items: quote.items,
        terms: quote.terms || "",
        currency: quote.currency || "USD",
        discount: quote.discount || 0,
        discountType: quote.discountType || "flat",
        taxPercent: quote.taxPercent || 0,
        shippingCharge: quote.shippingCharge || 0,
      };

      localStorage.setItem("quoteDraft", JSON.stringify(fullDraft));
      router.push("/");
    } catch {
      toastError("Could not load quotation into builder.");
    }
  };

  // Metrics strictly derived from user's actual quotations
  const totalCount = quotations.length;
  const quoteCount = quotations.filter((q) => q.items && q.items.some((i) => (Number(i.unitPrice) || 0) > 0)).length;
  const draftCount = quotations.filter((q) => q.type === "rfq" || !q.items || !q.items.some((i) => (Number(i.unitPrice) || 0) > 0)).length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthCount = quotations.filter((q) => {
    const rawDate = q.createdAt || q.date;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "Partner";

  // Helper to calculate total for a quote card
  const getQuoteTotalFormatted = (quote: QuotationRecord) => {
    const sym = CURRENCY_SYMBOLS[quote.currency] || "$";
    const sub = calculateSubtotal(quote.items || [], quote.tableColumns);
    const total = calculateGrandTotal(sub, quote.discount || 0, quote.discountType || "flat", quote.taxPercent || 0, quote.shippingCharge || 0);
    return `${sym} ${total.toLocaleString(quote.currency === "INR" ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen text-[#0F172A] pb-24 md:pb-12">
      {/* ===== SCREEN 1: NATIVE APP HEADER ===== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3 sticky top-0 z-20 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group min-h-[44px]">
            <QuoteCraftLogo size={32} showText={true} />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#475569] hover:bg-slate-100 transition-colors relative min-h-[44px] min-w-[44px]"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="w-2 h-2 rounded-full bg-[#0F766E] absolute top-2.5 right-2.5 ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-5 sm:py-6 space-y-6 animate-in fade-in duration-300">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-[22px] sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Welcome back, {firstName}!
          </h2>
          <p className="text-[13px] text-[#475569] font-medium">
            Create professional quotations in just a few clicks.
          </p>
        </div>

        {/* Primary CTA Button: + New Quotation (48px height, Deep Teal, Active scale) */}
        <div>
          <Link
            href="/?new=true"
            className="flex items-center justify-center gap-2 w-full h-12 px-6 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-[#0F766E]/20 transition-all min-h-[48px]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>+ New Quotation</span>
          </Link>
        </div>

        {/* 4 Stat Cards: Total, Sent, Drafts, This Month */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Total */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 text-center shadow-xs flex flex-col justify-center items-center min-h-[72px]">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#0F172A] leading-tight">
              {totalCount}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#475569] mt-0.5">
              Total
            </span>
          </div>

          {/* Sent */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 text-center shadow-xs flex flex-col justify-center items-center min-h-[72px]">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#0F766E] leading-tight">
              {quoteCount}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#475569] mt-0.5">
              Sent
            </span>
          </div>

          {/* Drafts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 text-center shadow-xs flex flex-col justify-center items-center min-h-[72px]">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#F59E0B] leading-tight">
              {draftCount}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#475569] mt-0.5">
              Drafts
            </span>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 text-center shadow-xs flex flex-col justify-center items-center min-h-[72px]">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#16A34A] leading-tight">
              {thisMonthCount}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#475569] mt-0.5">
              This Month
            </span>
          </div>
        </div>

        {/* Recent Quotations Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
              Recent Quotations
            </h3>
            <Link
              href="/quotations"
              className="text-xs font-bold text-[#0F766E] hover:text-[#0D6B63] flex items-center gap-1 min-h-[36px]"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <DualOrbitalSpinner size="md" />
              <p className="text-xs font-medium text-[#475569]">Loading quotations...</p>
            </div>
          ) : quotations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] text-[#0F766E] mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">No quotations created yet</h4>
                <p className="text-xs text-[#475569] max-w-sm mx-auto">
                  Upload an RFQ file or start a fresh quotation to view your recent quotations here.
                </p>
              </div>
              <Button asChild className="h-10 px-5 rounded-xl text-xs font-bold bg-[#0F766E] hover:bg-[#0D6B63] text-white">
                <Link href="/?new=true">
                  <Plus className="w-4 h-4 mr-1.5" /> Create Your First Quotation
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {quotations.slice(0, 5).map((quote) => {
                const isDraft = quote.type === "rfq" || !quote.items.some((i) => (Number(i.unitPrice) || 0) > 0);
                const statusLabel = isDraft ? "Draft" : "Sent";
                const statusClass = isDraft
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200";

                const clientName = quote.client?.companyName || quote.client?.name || "Standard Client";
                const formattedPrice = getQuoteTotalFormatted(quote);

                return (
                  <div
                    key={quote.id}
                    onClick={() => handleOpenInBuilder(quote)}
                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-mono font-bold text-xs sm:text-sm text-[#0F172A] truncate">
                          {quote.number}
                        </p>
                        <p className="text-xs text-[#475569] font-medium truncate">
                          {clientName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusClass}`}>
                        {statusLabel}
                      </span>
                      <span className="font-mono font-bold text-xs text-[#0F172A] hidden sm:inline">
                        {formattedPrice}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(quote);
                        }}
                        disabled={downloadingId === quote.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0F766E] hover:bg-teal-50 transition-colors"
                        title="Download PDF"
                      >
                        {downloadingId === quote.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteQuoteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-extrabold text-[#0F172A]">Delete Quotation?</h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Are you sure you want to delete <span className="font-mono font-bold text-slate-800">{deleteQuoteTarget.number}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDeleteQuoteTarget(null)}
                className="flex-1 h-10 rounded-xl text-xs font-bold border-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteQuotation}
                className="flex-1 h-10 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
