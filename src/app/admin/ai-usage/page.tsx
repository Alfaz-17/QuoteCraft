"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiUsageData {
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number;
    deterministicCount: number;
    geminiCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    avgLatencyMs: number;
  };
  dailyTrends: Array<{
    date: string;
    total_requests: string;
    tokens: string;
    cost_usd: string;
    avg_duration_ms: number;
  }>;
  topCustomers: Array<{
    customer_name: string;
    customer_email: string;
    request_count: string;
    total_tokens: number;
    total_cost_usd: number;
  }>;
  recentLogs: Array<{
    id: string;
    fileName: string | null;
    mimeType: string | null;
    method: string;
    model: string | null;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    durationMs: number;
    itemCount: number;
    status: string;
    errorMessage: string | null;
    createdAt: string;
    user_name: string | null;
    user_email: string | null;
  }>;
  failedReports: Array<{
    id: string;
    fileName: string | null;
    mimeType: string | null;
    method: string;
    errorMessage: string | null;
    durationMs: number;
    createdAt: string;
    user_email: string | null;
  }>;
}

export const dynamic = "force-dynamic";

export default function AdminAiUsagePage() {
  const router = useRouter();
  const [data, setData] = useState<AiUsageData | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState<"logs" | "errors" | "consumers">("logs");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAiUsage = async (selectedRange = range) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ai-usage?range=${selectedRange}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load AI usage monitoring data");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAiUsage(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-semibold text-slate-900">
              AI usage
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            AI extraction volume, estimated cost, speed and errors.
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
            onClick={() => fetchAiUsage(range)}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-slate-200 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* 1. Operational KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Extractions */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Extractions
                  </span>
                  <Cpu className="w-4 h-4 text-[#0F766E]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {data.metrics.totalRequests}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {data.metrics.deterministicCount} zero-cost • {data.metrics.geminiCount} Groq AI LLM
                </p>
              </div>

              {/* Total Tokens Consumed */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Tokens
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {data.metrics.totalTokens.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  In: {data.metrics.totalInputTokens.toLocaleString()} • Out: {data.metrics.totalOutputTokens.toLocaleString()}
                </p>
              </div>

              {/* Estimated API Cost */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Calculated API Cost
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  ${data.metrics.totalCostUsd.toFixed(4)}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  At official $0.075 / $0.30 per 1M rate
                </p>
              </div>

              {/* Error Rate & Latency */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Avg Latency &amp; Errors
                  </span>
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {data.metrics.avgLatencyMs}ms
                  </span>
                  <span
                    className={`text-xs font-extrabold ${
                      data.metrics.errorRate > 5 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {data.metrics.errorRate}% error
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {data.metrics.failedRequests} failed of {data.metrics.totalRequests}
                </p>
              </div>
            </div>

            {/* 2. Sub-tabs: Recent Logs | Failed Error Reports | Top Consuming Users */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("logs")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "logs"
                        ? "bg-[#0F766E] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Live Extraction Logs ({data.recentLogs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("errors")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "errors"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Failed Extractions</span>
                    {data.failedReports.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 text-[10px] flex items-center justify-center font-black">
                        {data.failedReports.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("consumers")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "consumers"
                        ? "bg-[#0F766E] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Top Active Customers
                  </button>
                </div>
              </div>

              {/* TAB CONTENT: LIVE LOGS */}
              {activeTab === "logs" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <th className="p-3">File / Document</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Engine</th>
                        <th className="p-3 text-right">Tokens</th>
                        <th className="p-3 text-right">Est. Cost</th>
                        <th className="p-3 text-right">Latency</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.recentLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No extraction logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        data.recentLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-bold text-slate-900 truncate max-w-[180px]">
                              {log.fileName || "Pasted Raw Text"}
                            </td>
                            <td className="p-3 text-slate-600 truncate max-w-[150px] font-mono text-[11px]">
                              {log.user_email || "Anonymous"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                  log.method === "deterministic_excel" || log.method === "deterministic_pdf"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-teal-100 text-teal-800"
                                }`}
                              >
                                {log.method === "deterministic_excel" || log.method === "deterministic_pdf"
                                  ? "Deterministic"
                                  : "Groq AI"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              {log.totalTokens > 0 ? log.totalTokens.toLocaleString() : "0"}
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                              ${log.estimatedCostUsd.toFixed(4)}
                            </td>
                            <td className="p-3 text-right text-slate-500 font-mono">
                              {log.durationMs}ms
                            </td>
                            <td className="p-3 text-center">
                              {log.status === "SUCCESS" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                  <XCircle className="w-3.5 h-3.5" /> Fail
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB CONTENT: ERROR REPORTS */}
              {activeTab === "errors" && (
                <div className="space-y-3">
                  {data.failedReports.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      Zero extraction errors recorded! All requests processed smoothly.
                    </div>
                  ) : (
                    data.failedReports.map((err) => (
                      <div
                        key={err.id}
                        className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-900">
                          <span className="font-extrabold text-rose-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            {err.fileName || "Pasted Input"}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(err.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-rose-950 bg-white p-2 rounded-lg border border-rose-200">
                          {err.errorMessage || "Unknown extraction failure"}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>User: {err.user_email || "Anonymous"}</span>
                          <span>Duration: {err.durationMs}ms</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: TOP CONSUMERS */}
              {activeTab === "consumers" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-center">Requests</th>
                        <th className="p-3 text-right">Tokens Consumed</th>
                        <th className="p-3 text-right">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.topCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            No active consumers recorded in this timeframe.
                          </td>
                        </tr>
                      ) : (
                        data.topCustomers.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{c.customer_name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{c.customer_email}</p>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-800">
                              {c.request_count}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              {c.total_tokens.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                              ${c.total_cost_usd.toFixed(4)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

