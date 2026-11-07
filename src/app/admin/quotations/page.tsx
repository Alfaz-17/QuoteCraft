"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Ship,
  Building,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";

interface AdminQuotation {
  id: string;
  number: string;
  type: string;
  date: string;
  validUntil: string;
  vessel: string | null;
  reference: string | null;
  currency: string;
  discount: number;
  taxPercent: number;
  shippingCharge: number;
  createdAt: string;
  updatedAt: string;
  item_count: number;
  supplier_company: string | null;
  buyer_company: string | null;
  user_name: string | null;
  user_email: string | null;
}

export const dynamic = "force-dynamic";

export default function AdminQuotationsPage() {
  const router = useRouter();
  const { error: toastError } = useToast();

  const [quotations, setQuotations] = useState<AdminQuotation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Inspector modal for metadata
  const [inspectQuote, setInspectQuote] = useState<AdminQuotation | null>(null);

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        type: typeFilter,
        search,
      });

      const res = await fetch(`/api/admin/quotations?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load platform quotations");
      const json = await res.json();
      setQuotations(json.quotations || []);
      setTotalCount(json.pagination.total);
      setTotalPages(json.pagination.totalPages || 1);
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to fetch quotations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuotations();
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quotation Management
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Platform-wide quotation registry. Tenant-isolated metadata for compliance and volume tracking.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchQuotations()}
          disabled={isLoading}
          className="self-start sm:self-auto h-9 px-3 rounded-xl border-slate-200 bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quotation number, vessel, buyer, or user email..."
            className="pl-9 h-11 bg-white border-slate-200 rounded-xl text-xs font-medium"
          />
        </form>

        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: "All Types" },
            { id: "quotation", label: "Quotes" },
            { id: "proforma", label: "Proforma" },
            { id: "rfq", label: "RFQ" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTypeFilter(t.id);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === t.id
                  ? "bg-[#0F766E] text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">Quotation #</th>
                <th className="p-4">Supplier Account</th>
                <th className="p-4">Buyer / Vessel</th>
                <th className="p-4 text-center">Items</th>
                <th className="p-4">Currency</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading && quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No quotations found matching your criteria.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {q.number}
                        </span>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#0F766E] bg-[#E0F2F1] px-1.5 py-0.2 rounded">
                            {q.type}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800 truncate max-w-[160px]">
                        {q.supplier_company || q.user_name || "Marine Supplier"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">
                        {q.user_email}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900 truncate max-w-[180px]">
                        {q.buyer_company}
                      </p>
                      {q.vessel && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[180px]">
                          <Ship className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{q.vessel}</span>
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-center font-mono font-bold text-slate-800">
                      {q.item_count}
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-700">
                      {q.currency}
                    </td>

                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {q.date}
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectQuote(q)}
                        className="h-8 px-2.5 text-xs font-bold text-[#0F766E] hover:text-[#0D6B63] hover:bg-[#E0F2F1]/50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 px-2.5 rounded-lg border-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-8 px-2.5 rounded-lg border-slate-200"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Inspector Modal */}
      {inspectQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-black text-base text-slate-900">
                  Quotation Metadata: {inspectQuote.number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectQuote(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tenant Privacy Protected:</strong> Private line item prices and descriptions belong strictly to the supplier. Only header metadata is displayed.
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Document Type:</span>
                <span className="font-bold text-slate-900 uppercase">{inspectQuote.type}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Issued By:</span>
                <span className="font-mono text-slate-900">{inspectQuote.user_email}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Supplier Company:</span>
                <span className="font-bold text-slate-900">{inspectQuote.supplier_company || "—"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Customer / Buyer:</span>
                <span className="font-bold text-slate-900">{inspectQuote.buyer_company || "—"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Vessel / Project:</span>
                <span className="font-bold text-slate-900">{inspectQuote.vessel || "—"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Line Items Count:</span>
                <span className="font-mono font-bold text-slate-900">{inspectQuote.item_count} items</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Currency &amp; Tax:</span>
                <span className="font-mono text-slate-900">
                  {inspectQuote.currency} • Tax {inspectQuote.taxPercent}% • Discount {inspectQuote.discount}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Issue / Validity:</span>
                <span className="font-mono text-slate-900">
                  {inspectQuote.date} to {inspectQuote.validUntil}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectQuote(null)}
                className="rounded-xl border-slate-200 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

