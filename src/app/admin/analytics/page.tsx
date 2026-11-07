"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  FileText,
  Cpu,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  periodDays: number;
  funnel: Array<{
    step: string;
    count: number;
    rate: number;
  }>;
  metrics: {
    totalUploads: number;
    successfulExtractions: number;
    failedExtractions: number;
    quotesCreated: number;
    extractionRate: number;
    conversionToQuoteRate: number;
  };
  methodBreakdown: Array<{
    method: string;
    count: string;
    total_cost: string;
    avg_duration_ms: string;
  }>;
  currencyBreakdown: Array<{
    currency: string;
    count: string;
    avg_discount: string;
  }>;
  dailyActivity: Array<{
    date: string;
    successful_extractions: string;
    failed_extractions: string;
  }>;
}

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (selectedRange = range) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Product &amp; Workflow Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            End-to-end quotation creation funnel, extraction success metrics, and buyer currency distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-2xs">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === r
                    ? "bg-[#0F766E] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(range)}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-slate-200 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-slate-200/60 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* 1. Workflow Funnel Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0F766E]" />
                  Quotation Creation Funnel
                </h3>
                <p className="text-xs text-slate-500">
                  How efficiently users move from uploading an RFQ enquiry to generating a final commercial quotation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.funnel.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 relative space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Step {idx + 1}</span>
                      {idx > 0 && (
                        <span className="text-[11px] font-extrabold text-[#0F766E] bg-[#E0F2F1] px-2 py-0.5 rounded">
                          {step.rate}% conversion
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800">{step.step}</p>
                    <p className="text-2xl font-black text-slate-900">{step.count}</p>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-[#0F766E] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(8, step.rate))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Method Breakdown & Currencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Extraction Engines */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-500" />
                      Extraction Architecture
                    </h3>
                    <p className="text-xs text-slate-500">
                      Zero-cost deterministic Excel parsing vs Gemini 2.5 Flash LLM fallback.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.methodBreakdown.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No document extraction events recorded in this period.
                    </div>
                  ) : (
                    data.methodBreakdown.map((m, idx) => {
                      const isDeterministic = m.method === "deterministic_excel";
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {isDeterministic
                                  ? "Deterministic Excel Parser"
                                  : "Gemini 2.5 Flash AI Fallback"}
                              </span>
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded uppercase ${
                                  isDeterministic
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-teal-100 text-teal-800"
                                }`}
                              >
                                {isDeterministic ? "$0.00 Cost" : "AI Multimodal"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Average latency: {Math.round(parseFloat(m.avg_duration_ms || "0"))}ms
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-slate-900">{m.count}</span>
                            <p className="text-[11px] text-slate-500 font-mono">
                              ${parseFloat(m.total_cost || "0").toFixed(4)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top Currencies */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      Top Commercial Currencies
                    </h3>
                    <p className="text-xs text-slate-500">
                      Currencies chosen by suppliers on exported marine quotations.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.currencyBreakdown.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No quotations created in this period yet.
                    </div>
                  ) : (
                    data.currencyBreakdown.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                            {c.currency}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900">{c.currency}</p>
                            <p className="text-[11px] text-slate-500">
                              Avg discount: {parseFloat(c.avg_discount || "0").toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-black text-slate-900">
                          {c.count} {parseInt(c.count, 10) === 1 ? "quote" : "quotes"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

