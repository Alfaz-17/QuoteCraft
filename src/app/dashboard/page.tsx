"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FilePlus, 
  UploadCloud, 
  Search, 
  Ship, 
  Calendar, 
  ArrowRight, 
  FileText, 
  Clock, 
  Download, 
  Copy, 
  Trash2, 
  ExternalLink,
  Loader2,
  Anchor,
  TrendingUp,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CURRENCY_SYMBOLS, Currency, LineItem, TableColumn, QuotationState } from "@/types/quotation.types";
import { calculateSubtotal, calculateGrandTotal } from "@/utils/calculations";
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

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeDraft, setActiveDraft] = useState<Partial<QuotationState> | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const draftStr = localStorage.getItem("quoteDraft");
      if (draftStr) {
        const parsed = JSON.parse(draftStr);
        if (parsed?.items?.length > 0 && parsed.items.some((i: LineItem) => i.itemName || i.partNumber)) {
          setActiveDraft(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/quotations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load quotations");
      const data = await res.json();
      setQuotations(data.quotations || []);
    } catch (err: unknown) {
      console.error(err);
      toastError("Could not load quotations.");
    } finally {
      setLoading(false);
    }
  }, [status, search, typeFilter, toastError]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleDownloadPDF = async (quote: QuotationRecord) => {
    setDownloadingId(quote.id);
    try {
      // Reconstruct complete state for PDF generator
      const pdfState: QuotationState = {
        branding: {
          logo: null,
          primaryColor: "#2563eb",
          secondaryColor: "#64748b",
          textColor: "#1e293b",
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
          { id: "name", label: "Item Name", key: "itemName", type: "text", visible: true },
          { id: "partNumber", label: "Part No.", key: "partNumber", type: "text", visible: true, width: "110px" },
          { id: "qty", label: "Qty", key: "quantity", type: "number", role: "qty", visible: true, width: "70px" },
          { id: "unit", label: "Unit", key: "unit", type: "text", visible: true, width: "70px" },
          { id: "condition", label: "Condition", key: "condition", type: "text", visible: true, width: "100px" },
          { id: "rate", label: "Rate", key: "unitPrice", type: "number", role: "price", visible: true, width: "90px" },
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

  // Metrics from real data
  const totalCount = quotations.length;
  const rfqCount = quotations.filter((q) => q.type === "rfq").length;
  const quoteCount = quotations.filter((q) => q.type === "quotation").length;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen text-slate-900 pb-24 md:pb-10">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Welcome back, {session?.user?.name || "Marine Supplier"}. Manage your quotes and incoming RFQs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              asChild
              className="h-10 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 min-h-[44px]"
            >
              <Link href="/">
                <FilePlus className="w-4 h-4 mr-1.5" />
                New Quotation
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
        {/* Quick Metrics Bar (Real Data Only) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Saved</p>
            <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">{totalCount}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Quotes in database</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quotations</p>
            <h3 className="text-2xl font-black font-mono text-primary mt-1">{quoteCount}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Commercial offers</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RFQs</p>
            <h3 className="text-2xl font-black font-mono text-amber-600 mt-1">{rfqCount}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Requests processed</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Draft</p>
            <h3 className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {activeDraft ? "1" : "0"}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {activeDraft ? `${activeDraft.items?.length || 0} items in progress` : "No unsaved draft"}
            </p>
          </div>
        </div>

        {/* Active Draft Alert Banner (If present) */}
        {activeDraft && (
          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-emerald-950">
                    Active Draft in Progress
                  </h4>
                  {activeDraft.documentInfo?.number && (
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-white rounded border border-emerald-200 text-emerald-800">
                      {activeDraft.documentInfo.number}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  {activeDraft.client?.companyName || activeDraft.client?.name ? `For ${activeDraft.client.companyName || activeDraft.client.name} • ` : ""}
                  {activeDraft.items?.length || 0} line item(s) ready for review or pricing.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              asChild
              className="h-9 px-4 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 min-h-[40px]"
            >
              <Link href="/">
                Continue Draft <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by quote number, vessel, reference, or buyer company..."
              className="h-10 pl-9 text-xs sm:text-sm font-medium rounded-xl border-slate-200 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
            {["all", "quotation", "rfq", "proforma"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors min-h-[38px] ${
                  typeFilter === t
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Quotation List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
              Recent Quotations & Inquiries ({quotations.length})
            </h3>
            {quotations.length > 0 && (
              <Link
                href="/quotations"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View all archive →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Loading quotations from cloud database...</p>
            </div>
          ) : quotations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 sm:p-14 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">No Quotations Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search
                    ? `No quotations matched "${search}". Try clearing your search query.`
                    : "You haven't created any quotations yet. Create your first quote or import an RFQ spreadsheet."}
                </p>
              </div>
              <div>
                <Button
                  asChild
                  className="h-10 px-6 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white min-h-[44px]"
                >
                  <Link href="/">
                    <FilePlus className="w-4 h-4 mr-1.5" /> Start First Quotation
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {quotations.map((quote) => {
                const sub = calculateSubtotal(quote.items, quote.tableColumns);
                const grand = calculateGrandTotal(
                  sub,
                  quote.discount,
                  quote.discountType,
                  quote.taxPercent,
                  quote.shippingCharge
                );
                const sym = CURRENCY_SYMBOLS[quote.currency] || "$";
                const isDownloading = downloadingId === quote.id;

                return (
                  <div
                    key={quote.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {quote.number}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            quote.type === "rfq"
                              ? "bg-amber-100 text-amber-800"
                              : quote.type === "proforma"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {quote.type}
                        </span>
                        {quote.vessel && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-semibold">
                            <Ship className="w-3.5 h-3.5 text-primary" /> {quote.vessel}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                        {quote.client?.companyName || quote.client?.name ? (
                          <span className="font-bold text-slate-900 truncate">
                            Buyer: {quote.client.companyName || quote.client.name}
                          </span>
                        ) : null}
                        <span>{quote.items?.length || 0} line item(s)</span>
                        <span className="text-slate-400">
                          Date: {quote.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grand Total</p>
                        <p className="font-mono font-black text-base sm:text-lg text-slate-900 leading-tight">
                          {sym}{grand.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(quote)}
                          disabled={isDownloading}
                          className="h-9 px-3 rounded-xl font-bold text-xs border-slate-200 min-h-[36px]"
                          title="Download PDF"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenInBuilder(quote)}
                          className="h-9 px-3.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white min-h-[36px]"
                        >
                          Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
