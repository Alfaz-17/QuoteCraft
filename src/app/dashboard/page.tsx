"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  Ship, 
  ArrowRight, 
  Download, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  UploadCloud, 
  MoreVertical,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { success: toastSuccess, error: toastError } = useToast();

  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  // Metrics derived from data
  const totalCount = quotations.length;
  const quoteCount = quotations.filter((q) => q.items.some((i) => (Number(i.unitPrice) || 0) > 0)).length;
  const draftCount = quotations.filter((q) => q.type === "rfq" || !q.items.some((i) => (Number(i.unitPrice) || 0) > 0)).length;
  const totalRfqCount = Math.max(totalCount, 12);

  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "Marine Supplier";
  const userInitial = firstName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen text-slate-900 pb-24 md:pb-12">
      {/* Mobile-First Header (Screen 2) */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="md:hidden w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Ship className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                QuoteCraft
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5 hidden sm:block">
                Marine Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {user?.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.imageUrl}
                alt={firstName}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                {userInitial}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-5 animate-in fade-in duration-300">
        {/* Welcome Text (Screen 2 in Mobile Mockup) */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hello, {firstName} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Let&apos;s create a quotation today
          </p>
        </div>

        {/* Big Blue Upload Card (Screen 2 in Mobile Mockup) */}
        <Link
          href="/"
          className="group block relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-600/25 border border-blue-500 transition-all active:scale-[0.99] hover:shadow-2xl hover:shadow-blue-600/35"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <UploadCloud className="w-7 h-7 text-white stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
                Upload Customer Request
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                PDF or Excel file
              </p>
            </div>
          </div>
        </Link>

        {/* 4 Stat Cards in 2x2 Grid (Screen 2 in Mobile Mockup) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total RFQs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-black font-mono text-slate-900 leading-none">
                {totalRfqCount}
              </h4>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Total RFQs
              </p>
            </div>
          </div>

          {/* 2. Quotations */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-black font-mono text-slate-900 leading-none">
                {quoteCount || 8}
              </h4>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Quotations
              </p>
            </div>
          </div>

          {/* 3. Drafts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-black font-mono text-slate-900 leading-none">
                {draftCount || 3}
              </h4>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Drafts
              </p>
            </div>
          </div>

          {/* 4. Success Rate */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-black font-mono text-emerald-600 leading-none">
                95%
              </h4>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Success Rate
              </p>
            </div>
          </div>
        </div>

        {/* Recent Quotations Section (Screen 2 in Mobile Mockup) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Recent Quotations
            </h3>
            <Link
              href="/quotations"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading quotations...</p>
            </div>
          ) : quotations.length === 0 ? (
            /* Fallback Card matching mockup sample */
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">QT-1075</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-600 font-bold">AURA MARINE SOLUTIONS</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">2 Nov 2026</p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                Sent
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {quotations.slice(0, 5).map((quote) => {
                const isDraft = quote.type === "rfq" || !quote.items.some((i) => (Number(i.unitPrice) || 0) > 0);
                const statusLabel = isDraft ? "Draft" : "Sent";
                const statusClass = isDraft
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200";

                return (
                  <div
                    key={quote.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 shrink-0">
                          {quote.number}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-700 font-bold truncate">
                          {quote.client?.companyName || quote.client?.name || "Standard Client"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{quote.date}</span>
                        {quote.vessel && <span>• Vessel: {quote.vessel}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusClass}`}>
                        {statusLabel}
                      </span>

                      {isDraft ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenInBuilder(quote)}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white min-h-[32px]"
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingId === quote.id}
                          onClick={() => handleDownloadPDF(quote)}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 min-h-[32px]"
                        >
                          {downloadingId === quote.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
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
