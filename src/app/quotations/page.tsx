"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  FilePlus, 
  Search, 
  Ship, 
  Download, 
  Edit3, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowLeft,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Currency, LineItem, TableColumn, QuotationState } from "@/types/quotation.types";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { useToast } from "@/components/ui/Toast";

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
    if (isLoaded && isSignedIn) {
      fetchQuotations();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchQuotations]);

  const handleDownloadPDF = async (quote: QuotationRecord) => {
    setDownloadingId(quote.id);
    try {
      const pdfState: QuotationState = {
        branding: {
          logo: null,
          primaryColor: "#0B1528",
          secondaryColor: "#1E3A8A",
          textColor: "#0F172A",
          font: "Inter",
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

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / pageSize));
  const displayedQuotations = filteredQuotations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen text-slate-900 pb-24 md:pb-12">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-700 md:hidden mr-1">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              My Quotations
            </h1>
          </div>

          <Button
            asChild
            className="h-9 px-3.5 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-xs"
          >
            <Link href="/">
              <FilePlus className="w-3.5 h-3.5 mr-1" /> New Quote
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
        {/* Search Input Bar (Screen 8 in Mobile Mockup) */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search quotations..."
            className="h-10 pl-9 pr-3 text-xs sm:text-sm rounded-xl border-slate-200 bg-white"
          />
        </div>

        {/* Filter Tabs: All | Sent | Draft | Expired (Screen 8 in Mobile Mockup) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab.id
                  ? "bg-[#0F766E] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MOBILE QUOTATION CARDS (Screen 8 in Mobile Mockup: block md:hidden) ── */}
        <div className="block md:hidden space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
              <p className="text-xs font-medium">Loading quotations...</p>
            </div>
          ) : displayedQuotations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No quotations found</p>
              <Button asChild size="sm" className="h-9 px-4 rounded-xl text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white">
                <Link href="/">Create Quotation</Link>
              </Button>
            </div>
          ) : (
            displayedQuotations.map((quote) => {
              const isDraft = quote.type === "rfq" || !quote.items.some((i) => (Number(i.unitPrice) || 0) > 0);
              const statusLabel = isDraft ? "Draft" : "Sent";
              const statusClass = isDraft
                ? "bg-slate-100 text-slate-700 border-slate-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200";

              return (
                <div
                  key={quote.id}
                  onClick={() => handleEdit(quote)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5 cursor-pointer hover:border-blue-400 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900">
                        <span>{quote.number}</span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                        {quote.client?.companyName || quote.client?.name || "Standard Client"}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                    <span>{quote.date}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(quote);
                        }}
                        className="p-1 text-[#0F766E] hover:text-[#0D6B63]"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP TABLE VIEW (hidden md:block) ── */}
        <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
              <p className="text-xs font-medium">Loading quotations...</p>
            </div>
          ) : displayedQuotations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center" />
              <h4 className="font-bold text-sm text-slate-800">No quotations found</h4>
              <Button asChild className="h-10 px-5 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white">
                <Link href="/">Create Quotation</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 sm:px-6">Quotation No.</th>
                    <th className="py-3.5 px-4 sm:px-6">Customer</th>
                    <th className="py-3.5 px-4 sm:px-6">Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {displayedQuotations.map((quote) => {
                    const isDraft = quote.type === "rfq" || !quote.items.some((i) => (Number(i.unitPrice) || 0) > 0);
                    const statusLabel = isDraft ? "Draft" : "Sent";
                    const statusClass = isDraft
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200";

                    return (
                      <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-bold font-mono text-slate-900">
                          {quote.number}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <p className="font-bold text-slate-900">
                            {quote.client?.companyName || quote.client?.name || "Standard Client"}
                          </p>
                          {quote.vessel && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Ship className="w-3 h-3 text-[#0F766E]" /> {quote.vessel}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                          {quote.date}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          {isDraft ? (
                            <Button
                              size="sm"
                              onClick={() => handleEdit(quote)}
                              className="h-8 px-3.5 rounded-lg text-xs font-bold bg-[#0F766E] hover:bg-[#0D6B63] text-white min-h-[32px]"
                            >
                              <Edit3 className="w-3 h-3 mr-1" /> Edit
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={downloadingId === quote.id}
                              onClick={() => handleDownloadPDF(quote)}
                              className="h-8 px-3.5 rounded-lg text-xs font-bold border-teal-200 text-[#0F766E] hover:bg-[#E0F2F1] min-h-[32px]"
                            >
                              {downloadingId === quote.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Download className="w-3 h-3 mr-1" /> Download
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Desktop Pagination */}
          <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div>
              Showing {displayedQuotations.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredQuotations.length)} of {filteredQuotations.length}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                    currentPage === i + 1
                      ? "bg-[#0F766E] text-white shadow-xs"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
