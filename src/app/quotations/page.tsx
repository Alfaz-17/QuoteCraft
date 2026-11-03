"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FilePlus, 
  Search, 
  Ship, 
  ArrowRight, 
  Download, 
  Copy, 
  Trash2, 
  Loader2,
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

export default function QuotationsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter !== "all") params.set("type", typeFilter);

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
      toastSuccess(`Downloaded PDF for ${quote.number}`);
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

  const handleDuplicate = async (quote: QuotationRecord) => {
    try {
      const newNum = `QT-${Date.now().toString().slice(-4)}`;
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quote,
          number: newNum,
          date: new Date().toISOString().split("T")[0],
          validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        }),
      });

      if (!res.ok) throw new Error("Failed to duplicate quotation");
      toastSuccess(`Quotation duplicated as ${newNum}!`);
      fetchQuotations();
    } catch (err: unknown) {
      console.error(err);
      toastError("Failed to duplicate quotation.");
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete quotation ${number}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quotation");
      toastSuccess(`Quotation ${number} deleted.`);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
    } catch (err: unknown) {
      console.error(err);
      toastError("Failed to delete quotation.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen text-slate-900 pb-24 md:pb-10">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quotation Records
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Archive of all commercial quotations, RFQs, and proforma invoices.
            </p>
          </div>

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
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-5 animate-in fade-in duration-300">
        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by quote number, vessel, reference, buyer company..."
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

        {/* Content Section */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading quotations...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800">No Records Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search
                  ? `No quotations matched "${search}".`
                  : "You haven't saved any quotations yet."}
              </p>
            </div>
            <div>
              <Button asChild className="h-10 px-5 rounded-xl font-bold text-xs bg-primary text-white">
                <Link href="/">Create First Quotation</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
              const isDeleting = deletingId === quote.id;

              return (
                <div
                  key={quote.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black px-2.5 py-1 rounded bg-slate-100 text-slate-900 border border-slate-200">
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
                        <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-bold">
                          <Ship className="w-3.5 h-3.5 text-primary" /> {quote.vessel}
                        </span>
                      )}
                      {quote.reference && (
                        <span className="text-xs text-slate-500 font-medium">
                          Ref: {quote.reference}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      {quote.client?.companyName || quote.client?.name ? (
                        <span className="font-semibold text-slate-900">
                          Buyer: {quote.client.companyName || quote.client.name}
                        </span>
                      ) : null}
                      <span>{quote.items?.length || 0} line items</span>
                      <span className="text-slate-400">Date: {quote.date}</span>
                      <span className="text-slate-400">Valid: {quote.validUntil}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grand Total</p>
                      <p className="font-mono font-black text-lg text-slate-900 leading-tight">
                        {sym}{grand.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(quote)}
                        disabled={isDownloading}
                        className="h-9 px-2.5 rounded-xl font-bold text-xs border-slate-200 min-h-[36px]"
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
                        variant="outline"
                        onClick={() => handleDuplicate(quote)}
                        className="h-9 px-2.5 rounded-xl font-bold text-xs border-slate-200 min-h-[36px]"
                        title="Duplicate as new quotation"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(quote.id, quote.number)}
                        disabled={isDeleting}
                        className="h-9 px-2.5 rounded-xl font-bold text-xs border-slate-200 text-rose-600 hover:bg-rose-50 min-h-[36px]"
                        title="Delete quotation"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
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
      </main>
    </div>
  );
}
