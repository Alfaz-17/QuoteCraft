"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FileSpreadsheet,
  Cpu,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewData {
  admin: { name: string; email: string; role: string };
  stats: {
    totalUsers: number;
    activeUsers30d: number;
    newUsersInPeriod: number;
    totalQuotations: number;
    quotationsInPeriod: number;
    totalAiRequests: number;
    successfulAiRequests: number;
    failedAiRequests: number;
    totalTokens: number;
    totalEstimatedCostUsd: number;
    avgDurationMs: number;
  };
  trends: Array<{
    date: string;
    new_users: number;
    quotes: number;
    ai_requests: number;
  }>;
  recentActivity: Array<{
    id: string;
    eventType: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    user_name: string | null;
    user_email: string | null;
  }>;
}

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async (selectedRange = range) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/overview?range=${selectedRange}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load overview data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Founder Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-[#E0F2F1] text-[#0F766E] font-black text-[10px] uppercase tracking-wider">
              Live Production
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time business performance, customer growth, and AI cost tracking for QuoteCraft.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
                {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOverview(range)}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-slate-200 bg-white"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="font-bold text-sm">{error}</p>
          <Button onClick={() => fetchOverview(range)} variant="outline" className="border-rose-300">
            Retry Connection
          </Button>
        </div>
      ) : isLoading && !data ? (
        /* Skeletons */
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* 1. Main Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Customers
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {data.stats.totalUsers}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center">
                    +{data.stats.newUsersInPeriod} in period
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {data.stats.activeUsers30d} active in last 30d
                </p>
              </div>

              {/* Total Quotations */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Quotations
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {data.stats.totalQuotations}
                  </span>
                  <span className="text-xs font-semibold text-[#0F766E]">
                    +{data.stats.quotationsInPeriod} in period
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  All exported PDFs &amp; proformas
                </p>
              </div>

              {/* Total AI Extractions */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    AI Extractions
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {data.stats.totalAiRequests}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {data.stats.successfulAiRequests} success
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {data.stats.avgDurationMs}ms avg processing latency
                </p>
              </div>

              {/* Estimated AI Cost */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Est. Gemini Cost
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    ${data.stats.totalEstimatedCostUsd.toFixed(4)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium font-mono">
                  {(data.stats.totalTokens / 1000).toFixed(1)}k total tokens used
                </p>
              </div>
            </div>

            {/* 2. Growth Trends Graph & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Trend Chart (2 columns) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                      Activity Trends ({range.toUpperCase()})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Daily customer registrations, quotation outputs, and AI document parses.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" /> Quotes
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Users
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> AI RFQs
                    </span>
                  </div>
                </div>

                {/* Lightweight SVG Trend Visualizer */}
                {data.trends.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                    No activity recorded in this period yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-52 w-full flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
                      {data.trends.map((t, idx) => {
                        const maxVal = Math.max(
                          ...data.trends.map((item) => Math.max(item.quotes, item.new_users, item.ai_requests, 5))
                        );
                        const quoteHeight = Math.max(4, (t.quotes / maxVal) * 160);
                        const userHeight = Math.max(4, (t.new_users / maxVal) * 160);
                        const aiHeight = Math.max(4, (t.ai_requests / maxVal) * 160);

                        return (
                          <div
                            key={idx}
                            className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full gap-0.5 group relative"
                          >
                            {/* Hover tooltip */}
                            <div className="absolute -top-12 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                              {t.date}: {t.quotes} quotes, {t.new_users} users, {t.ai_requests} AI
                            </div>
                            <div className="w-full flex items-end justify-center gap-0.5 h-full">
                              <div
                                style={{ height: `${quoteHeight}px` }}
                                className="w-1.5 sm:w-2 bg-[#0F766E] rounded-t transition-all"
                                title={`Quotes: ${t.quotes}`}
                              />
                              <div
                                style={{ height: `${userHeight}px` }}
                                className="w-1.5 sm:w-2 bg-blue-500 rounded-t transition-all"
                                title={`New Users: ${t.new_users}`}
                              />
                              <div
                                style={{ height: `${aiHeight}px` }}
                                className="w-1.5 sm:w-2 bg-[#F59E0B] rounded-t transition-all"
                                title={`AI Extractions: ${t.ai_requests}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{data.trends[0]?.date}</span>
                      <span>{data.trends[data.trends.length - 1]?.date}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Live Activity Stream (1 column) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#F59E0B]" />
                    Live Platform Feed
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Real-time</span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1">
                  {data.recentActivity.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No live events recorded yet.
                    </div>
                  ) : (
                    data.recentActivity.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs"
                      >
                        <div className="w-6 h-6 rounded-lg bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 truncate">
                              {evt.eventType.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {evt.user_email || "System / Guest"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/activity-logs")}
                  className="w-full text-xs font-bold border-slate-200 mt-2"
                >
                  View Security &amp; Audit Logs <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

