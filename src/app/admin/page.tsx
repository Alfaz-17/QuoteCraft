"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  SlidersHorizontal,
  Save,
  CheckCircle2,
  Sliders,
  Layers,
  Zap,
  Lock,
  ArrowRight,
  Info,
  Server,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/Toast";

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

interface AiEngineControls {
  dailyAiLimitPerUser: number;
  groqModel: string;
  maxUploadSizeMb: number;
  enableVisionFallback: boolean;
}

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [data, setData] = useState<OverviewData | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "quota" | "feed">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Quota & Engine Controls State
  const [dailyQuota, setDailyQuota] = useState(5);
  const [selectedModel, setSelectedModel] = useState("qwen/qwen3.8-27b");
  const [maxUploadMb, setMaxUploadMb] = useState(10);
  const [visionFallback, setVisionFallback] = useState(true);
  const [isSavingQuota, setIsSavingQuota] = useState(false);
  const [quotaLoaded, setQuotaLoaded] = useState(false);

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
      setError((err as Error)?.message || "Network error loading data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuotaControls = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const json = await res.json();
        const controls = json.settings?.ai_engine_controls as AiEngineControls | undefined;
        if (controls) {
          if (typeof controls.dailyAiLimitPerUser === "number") setDailyQuota(controls.dailyAiLimitPerUser);
          if (controls.groqModel) setSelectedModel(controls.groqModel);
          if (typeof controls.maxUploadSizeMb === "number") setMaxUploadMb(controls.maxUploadSizeMb);
          if (typeof controls.enableVisionFallback === "boolean") setVisionFallback(controls.enableVisionFallback);
        }
        setQuotaLoaded(true);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    fetchOverview(range);
    fetchQuotaControls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const handleSaveQuotaRules = async () => {
    setIsSavingQuota(true);
    try {
      const newControls: AiEngineControls = {
        dailyAiLimitPerUser: Number(dailyQuota) || 5,
        groqModel: selectedModel.trim() || "qwen/qwen3.8-27b",
        maxUploadSizeMb: Number(maxUploadMb) || 10,
        enableVisionFallback: visionFallback,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "ai_engine_controls",
          value: newControls,
        }),
      });

      if (!res.ok) throw new Error("Failed to update AI quota controls");

      toastSuccess(
        `AI limit updated! Each user is now allowed ${newControls.dailyAiLimitPerUser} AI extractions/day.`
      );
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to update quota controls");
    } finally {
      setIsSavingQuota(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* ── 1. EXECUTIVE HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-[#031820] to-[#0A2B36] rounded-2xl p-5 sm:p-6 text-white border border-[#0D3845] shadow-sm relative overflow-hidden">
        {/* Subtle decorative grid background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                SaaS Founder Command Center
              </h1>
              <Badge variant="outline" className="border-teal-400/40 text-teal-300 font-mono text-[10px] uppercase">
                Production Live
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Real-time marine supply metrics, user quotas, Groq LLM consumption, and operational controls.
            </p>
          </div>

          {/* Quick Date Filters & Refresh */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <div className="bg-[#041E26] border border-[#0D3845] rounded-xl p-1 flex items-center">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    range === r
                      ? "bg-[#0F766E] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchOverview(range);
                fetchQuotaControls();
              }}
              disabled={isLoading}
              className="h-9 px-3 rounded-xl border-[#0D3845] bg-[#041E26] text-slate-200 hover:text-white hover:bg-[#082E3A]"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Live Sub-Bar Strip: Platform Health & Quota Summary */}
        <div className="mt-5 pt-4 border-t border-[#0D3845]/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-slate-400">Database:</span>
            <span className="font-mono font-bold text-emerald-400">PostgreSQL Live</span>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400">AI Engine:</span>
            <span className="font-mono font-bold text-amber-300">Groq Qwen 27B</span>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="text-slate-400">User Quota:</span>
            <span className="font-mono font-bold text-white">{dailyQuota} RFQ/day</span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Access:</span>
            <span className="font-mono font-bold text-teal-200">Owner Verified</span>
          </div>
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
              <div key={i} className="h-32 rounded-2xl bg-slate-200/70 animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-slate-200/70 animate-pulse" />
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* ── 2. EXECUTIVE METRIC TILES (4 Core Pillars) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Marine Suppliers */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Suppliers
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {data.stats.totalUsers}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    +{data.stats.newUsersInPeriod} new
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Active suppliers (30d):</span>
                  <span className="font-mono font-bold text-slate-800">{data.stats.activeUsers30d}</span>
                </div>
              </div>

              {/* Card 2: Quotations Created */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Quotations Created
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 text-[#0F766E] flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {data.stats.totalQuotations}
                  </span>
                  <span className="text-[11px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    +{data.stats.quotationsInPeriod} in range
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Output formats:</span>
                  <span className="font-bold text-slate-800">PDF &amp; Proforma</span>
                </div>
              </div>

              {/* Card 3: AI Extractions & Latency */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    AI Extractions
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {data.stats.totalAiRequests}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {data.stats.successfulAiRequests} OK
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Average duration:</span>
                  <span className="font-mono font-bold text-slate-800">{data.stats.avgDurationMs}ms</span>
                </div>
              </div>

              {/* Card 4: AI Operational Cost */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total AI Cost
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    ${data.stats.totalEstimatedCostUsd.toFixed(4)}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tokens used:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(data.stats.totalTokens / 1000).toFixed(1)}k tokens
                  </span>
                </div>
              </div>
            </div>

            {/* ── 3. SHADCN TABS: COMMAND CENTER VIEWS ── */}
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <TabsTrigger value="overview" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Overview &amp; Trends</span>
                  </TabsTrigger>
                  <TabsTrigger value="quota" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                    <span>AI Quota &amp; Limits</span>
                  </TabsTrigger>
                  <TabsTrigger value="feed" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Live Audit Stream</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/customers"
                    className="text-xs font-bold text-slate-600 hover:text-[#0F766E] flex items-center gap-1 transition-colors px-2 py-1"
                  >
                    <span>View All Customers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* ── TAB 1: OVERVIEW & TRENDS ── */}
              <TabsContent value="overview" className="space-y-6 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Daily Trend Chart (2 columns) */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                          Activity Trends ({range.toUpperCase()})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Daily quotations created, new user onboardings, and AI RFQ imports.
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

                    {/* SVG Trend Bars */}
                    {data.trends.length === 0 ? (
                      <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                        No activity recorded in this time range.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-52 w-full flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
                          {data.trends.map((t, idx) => {
                            const maxVal = Math.max(
                              ...data.trends.map((item) =>
                                Math.max(item.quotes, item.new_users, item.ai_requests, 5)
                              )
                            );
                            const quoteHeight = Math.max(4, (t.quotes / maxVal) * 160);
                            const userHeight = Math.max(4, (t.new_users / maxVal) * 160);
                            const aiHeight = Math.max(4, (t.ai_requests / maxVal) * 160);

                            return (
                              <div
                                key={idx}
                                className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full gap-0.5 group relative"
                              >
                                {/* Tooltip on hover */}
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
                                    title={`AI RFQs: ${t.ai_requests}`}
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

                  {/* Right Column: Deterministic Savings & Quick Shortcuts */}
                  <div className="space-y-4">
                    {/* Deterministic Efficiency Card */}
                    <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/60 rounded-2xl border border-teal-200/90 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#0F766E]" />
                        <h4 className="font-extrabold text-sm text-slate-900">Deterministic Engine</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Deterministic parsing intercepts clean Excel &amp; PDF files directly without LLM API calls, saving 100% of LLM token costs and running in &lt;100ms.
                      </p>
                      <div className="p-3 bg-white/80 rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Cost Savings:</span>
                        <span className="font-mono font-black text-[#0F766E]">$0.00 LLM Cost on Excel</span>
                      </div>
                    </div>

                    {/* Quick Founder Actions */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-2.5">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                        Quick Founder Navigation
                      </h4>

                      <Link
                        href="/admin/customers"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Manage Customers</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      <Link
                        href="/admin/ai-usage"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-amber-600" />
                          <span>AI Usage &amp; Logs</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      <Link
                        href="/admin/settings"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#0F766E]" />
                          <span>Platform Settings</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      <Link
                        href="/admin/activity-logs"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Security Audit Logs</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB 2: AI QUOTA & ENGINE CONTROLS ── */}
              <TabsContent value="quota" className="space-y-6 outline-none">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6 max-w-3xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-[#0F766E]" />
                      <h3 className="font-extrabold text-base text-slate-900">
                        Global AI Quota &amp; Rate-Limit Controls
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Set and enforce daily AI fallback quotas per user. Note: Deterministic Excel and PDF extractions do not consume quota.
                    </p>
                  </div>

                  <div className="space-y-5 pt-2">
                    {/* Control 1: Daily AI Limit Per User */}
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-extrabold text-slate-900">
                            Daily Free AI Extraction Limit Per User
                          </Label>
                          <p className="text-[11px] text-slate-500">
                            Maximum AI document parses a single customer can run within a 24-hour window.
                          </p>
                        </div>
                        <span className="font-mono font-black text-lg text-[#0F766E] bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                          {dailyQuota} / day
                        </span>
                      </div>

                      {/* Quick preset pills */}
                      <div className="flex items-center gap-2 pt-2">
                        {[3, 5, 10, 20, 50].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDailyQuota(preset)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              dailyQuota === preset
                                ? "bg-[#0F766E] text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {preset} RFQs
                          </button>
                        ))}
                        <Input
                          type="number"
                          min="1"
                          max="500"
                          value={dailyQuota}
                          onChange={(e) => setDailyQuota(parseInt(e.target.value, 10) || 1)}
                          className="w-20 h-8 font-mono font-bold text-xs bg-white text-center rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Control 2: Groq Model Selector */}
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div>
                        <Label className="text-xs font-extrabold text-slate-900">
                          Active Groq LLM Model
                        </Label>
                        <p className="text-[11px] text-slate-500">
                          Select the fast production LLM used for untyped RFQ fallback.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {[
                          {
                            id: "qwen/qwen3.8-27b",
                            name: "Qwen 3.8-27B (Recommended)",
                            desc: "Fast marine table extraction with low latency",
                          },
                          {
                            id: "llama-3.3-70b-versatile",
                            name: "Llama 3.3-70B Versatile",
                            desc: "Higher capacity model for complex unstructured text",
                          },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedModel(m.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              selectedModel === m.id
                                ? "bg-teal-50/70 border-[#0F766E] ring-1 ring-[#0F766E]"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <p className="font-bold text-xs text-slate-900">{m.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{m.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Control 3: Max Upload Size & Vision OCR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <Label className="text-xs font-extrabold text-slate-900">
                          Max Upload File Size (MB)
                        </Label>
                        <p className="text-[11px] text-slate-500 mb-2">
                          Protects server memory and Groq TPM limits.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={maxUploadMb}
                            onChange={(e) => setMaxUploadMb(parseInt(e.target.value, 10) || 10)}
                            className="h-10 text-xs font-mono font-bold bg-white w-28 rounded-xl"
                          />
                          <span className="text-xs text-slate-600 font-bold">MB per file</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                        <div>
                          <Label className="text-xs font-extrabold text-slate-900">
                            Vision OCR Fallback
                          </Label>
                          <p className="text-[11px] text-slate-500">
                            Allow scanned RFQ images to pass to Groq vision format.
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setVisionFallback(!visionFallback)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              visionFallback
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {visionFallback ? "Vision OCR Enabled" : "Vision OCR Disabled"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Save Action Button */}
                    <div className="pt-2 flex justify-end">
                      <Button
                        onClick={handleSaveQuotaRules}
                        disabled={isSavingQuota}
                        className="h-11 px-6 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-md shadow-[#0F766E]/20 flex items-center gap-2"
                      >
                        {isSavingQuota ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating Quota...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save AI Quota Rules</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB 3: LIVE AUDIT FEED ── */}
              <TabsContent value="feed" className="space-y-4 outline-none">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#F59E0B]" />
                        Live Platform Telemetry Stream
                      </h3>
                      <p className="text-xs text-slate-500">
                        Chronological record of user registrations, RFQ extractions, and PDF exports.
                      </p>
                    </div>

                    <Link
                      href="/admin/activity-logs"
                      className="text-xs font-bold text-[#0F766E] hover:underline"
                    >
                      Audit Log Center &rarr;
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {data.recentActivity.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No live telemetry events recorded yet.
                      </div>
                    ) : (
                      data.recentActivity.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-[#0F766E] flex items-center justify-center font-bold shrink-0">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">
                                  {evt.eventType.replace(/_/g, " ")}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {evt.user_email || "System / Guest"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                                {JSON.stringify(evt.metadata)}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            {new Date(evt.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      )}
    </div>
  );
}
