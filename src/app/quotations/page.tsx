"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  FilePlus, 
  Search, 
  Download, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowLeft,
  Trash2,
  ArrowRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Currency, LineItem, TableColumn, QuotationState, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { DualOrbitalSpinner, HeroSailingLoader } from "@/components/ui/Loaders";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { useToast } from "@/components/ui/Toast";
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

export default function QuotationsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { success: toastSuccess, error: toastError } = useToast();

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
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
      const res = await fetch("/api/quotations?limit=100");
      if (!res.ok) throw new Error("Failed to load quotations");
      const data = await res.json();
      setQuotations(data.quotations || []);
    } catch (err: unknown) {
      console.error(err);
      toastError("Could not load quotations.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.replace("/sign-in");
      } else {
        fetchQuotations();
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
        branding: {
          logo: null,
          primaryColor: "#0F766E",
          secondaryColor: "#F59E0B",
          textColor: "#0F172A",
          font: "Manrope",
          layout: "marine",
        },
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
          { id: "name", label: "Item Description", key: "itemName", type: "text", visible: true },
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

  const handleEdit = (quote: QuotationRecord) => {
    try {
      const fullDraft: Partial<QuotationState> = {
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
      toastError("Could not load quotation into editor.");
    }
  };

  const getQuoteTotalFormatted = (quote: QuotationRecord) => {
    const sym = CURRENCY_SYMBOLS[quote.currency] || "$";
    const sub = calculateSubtotal(quote.items || [], quote.tableColumns);
    const total = calculateGrandTotal(sub, quote.discount || 0, quote.discountType || "flat", quote.taxPercent || 0, quote.shippingCharge || 0);
    return `${sym} ${total.toLocaleString(quote.currency === "INR" ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter items
  const filteredQuotations = quotations.filter((q) => {
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchNum = q.number.toLowerCase().includes(s);
      const matchClient = (q.client?.companyName || q.client?.name || "").toLowerCase().includes(s);
      const matchVessel = (q.vessel || "").toLowerCase().includes(s);
      if (!matchNum && !matchClient && !matchVessel) return false;
    }

    const isDraft = q.type === "rfq" || !q.items.some((i) => (Number(i.unitPrice) || 0) > 0);
    if (statusFilter === "sent" && isDraft) return false;
    if (statusFilter === "draft" && !isDraft) return false;
    if (statusFilter === "expired") {
      const validDate = new Date(q.validUntil);
      if (isNaN(validDate.getTime()) || validDate >= new Date()) return false;
    }

    return true;
  });

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / pageSize));
  const displayedQuotations = filteredQuotations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen text-[#0F172A] pb-24 md:pb-12">
      {/* ===== SCREEN 7: NATIVE APP HEADER ===== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3 sticky top-0 z-20 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors -ml-1 min-h-[44px] min-w-[44px]"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight leading-none">
              My Quotations
            </h1>
          </div>

          <Button
            asChild
            className="h-10 px-4 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-xs min-h-[44px]"
          >
            <Link href="/?new=true">
              <FilePlus className="w-4 h-4 mr-1.5" /> New Quote
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 space-y-4 animate-in fade-in duration-300">
        {/* Search Input Bar (Screen 7 in Mobile Mockup) */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search quotations..."
            className="h-11 pl-10 pr-4 text-base sm:text-sm rounded-xl border-slate-200 bg-white shadow-xs focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>

        {/* Filter Pills: All | Sent | Draft | Expired (Screen 7 in Mobile Mockup) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "sent", label: "Sent" },
            { id: "draft", label: "Draft" },
            { id: "expired", label: "Expired" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${
                statusFilter === tab.id
                  ? "bg-[#0F766E] text-white shadow-xs"
                  : "bg-white text-[#475569] border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MOBILE QUOTATION CARDS (Screen 7 in Mobile Mockup) ── */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <DualOrbitalSpinner size="md" />
              <p className="text-xs font-medium text-[#475569]">Loading quotations...</p>
            </div>
          ) : displayedQuotations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#0F172A]">No quotations found</p>
                <p className="text-xs text-[#475569]">Try a different search query or filter</p>
              </div>
              <Button asChild className="h-10 px-5 rounded-xl text-xs font-bold bg-[#0F766E] hover:bg-[#0D6B63] text-white">
                <Link href="/?new=true">Create Quotation</Link>
              </Button>
            </div>
          ) : (
            displayedQuotations.map((quote) => {
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
                  onClick={() => handleEdit(quote)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-[#0F172A]">
                          {quote.number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#0F172A] truncate">
                        {clientName}
                      </h4>
                      <p className="text-xs text-[#475569] font-medium">
                        {quote.date} {quote.vessel ? `• ${quote.vessel}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono font-extrabold text-sm sm:text-base text-[#0F172A] flex items-center gap-1">
                        {formattedPrice} <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(quote);
                      }}
                      disabled={downloadingId === quote.id}
                      className="px-3 py-1.5 rounded-lg border border-teal-200 text-[#0F766E] hover:bg-teal-50 font-bold transition-colors flex items-center gap-1.5 min-h-[36px]"
                      title="Download PDF"
                    >
                      {downloadingId === quote.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteQuoteTarget(quote);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete Quotation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-xs text-[#475569] font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
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
