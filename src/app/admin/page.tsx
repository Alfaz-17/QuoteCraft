"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, FileSpreadsheet, Cpu, DollarSign, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewData {
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
  trends: Array<{ date: string; new_users: number; quotes: number; ai_requests: number }>;
  recentActivity: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    user_name: string | null;
    user_email: string | null;
  }>;
}

type Range = "7d" | "30d" | "90d";
const RANGE_LABEL: Record<Range, string> = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };

export const dynamic = "force-dynamic";

function humanize(eventType: string) {
  const s = eventType.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [range, setRange] = useState<Range>("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async (r: Range = range) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/overview?range=${r}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Couldn't load dashboard data.");
      setData(await res.json());
    } catch (err: unknown) {
      setError((err as Error)?.message || "Couldn't load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const s = data?.stats;
  const maxVal = data ? Math.max(1, ...data.trends.map((t) => Math.max(t.quotes, t.new_users, t.ai_requests))) : 1;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">How QuoteCraft is being used.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
          >
            {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
              <option key={r} value={r}>
                {RANGE_LABEL[r]}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOverview(range)}
            disabled={isLoading}
            className="h-9 rounded-lg border-slate-200"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="p-6 rounded-xl bg-white border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-sm text-slate-700">{error}</p>
          <Button onClick={() => fetchOverview(range)} variant="outline" size="sm">
            Try again
          </Button>
        </div>
      ) : !s || !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Customers"
              value={s.totalUsers}
              hint={`+${s.newUsersInPeriod} new · ${s.activeUsers30d} active (30d)`}
              icon={Users}
            />
            <StatCard
              label="Quotations"
              value={s.totalQuotations}
              hint={`${s.quotationsInPeriod} created · ${RANGE_LABEL[range].toLowerCase()}`}
              icon={FileSpreadsheet}
            />
            <StatCard
              label="AI extractions"
              value={s.totalAiRequests}
              hint={`${s.failedAiRequests} failed · all time`}
              icon={Cpu}
            />
            <StatCard
              label="AI cost (est.)"
              value={`$${s.totalEstimatedCostUsd.toFixed(2)}`}
              hint={`${s.totalTokens.toLocaleString()} tokens · all time`}
              icon={DollarSign}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Daily activity</h2>
                  <p className="text-xs text-slate-500">{RANGE_LABEL[range]}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E]" /> Quotations
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" /> Sign-ups
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> AI extractions
                  </span>
                </div>
              </div>

              <div className="h-56 flex items-end gap-1 border-b border-slate-100">
                {data.trends.map((t) => (
                  <div key={t.date} className="flex-1 min-w-[6px] h-full flex items-end justify-center gap-px group relative">
                    <div className="absolute -top-1 -translate-y-full bg-slate-900 text-white text-[11px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                      {t.date}: {t.quotes} quotes · {t.new_users} sign-ups · {t.ai_requests} AI
                    </div>
                    <div style={{ height: `${(t.quotes / maxVal) * 100}%` }} className="flex-1 max-w-[8px] bg-[#0F766E] rounded-t-sm" />
                    <div style={{ height: `${(t.new_users / maxVal) * 100}%` }} className="flex-1 max-w-[8px] bg-sky-400 rounded-t-sm" />
                    <div style={{ height: `${(t.ai_requests / maxVal) * 100}%` }} className="flex-1 max-w-[8px] bg-amber-400 rounded-t-sm" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                <span>{data.trends[0]?.date}</span>
                <span>{data.trends[data.trends.length - 1]?.date}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
                <Link href="/admin/activity-logs" className="text-xs text-[#0F766E] hover:underline">
                  View all
                </Link>
              </div>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center">No activity yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentActivity.map((evt) => (
                    <li key={evt.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800">{humanize(evt.eventType)}</p>
                        <p className="text-xs text-slate-500 truncate">{evt.user_email || "Guest"}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{timeAgo(evt.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: "/admin/customers", title: "Customers", text: "Accounts, suspensions and per-customer AI limits" },
              { href: "/admin/ai-usage", title: "AI usage", text: "Extraction logs, errors and top users" },
              { href: "/admin/settings", title: "Settings", text: "Default daily AI limit and AI model" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{l.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.text}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
