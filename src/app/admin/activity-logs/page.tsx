"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetEntity: string;
  targetId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export const dynamic = "force-dynamic";

export default function AdminActivityLogsPage() {
  const router = useRouter();
  const { error: toastError } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Inspector modal
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        action: actionFilter,
        search,
      });

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load audit logs");
      const json = await res.json();
      setLogs(json.logs || []);
      setTotalCount(json.pagination.total);
      setTotalPages(json.pagination.totalPages || 1);
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to fetch logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Audit log
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              {totalCount} Total Entries
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Every admin action: suspensions, limit changes and setting updates.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
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
            placeholder="Search by action, admin email, entity, or target ID..."
            className="pl-9 h-11 bg-white border-slate-200 rounded-xl text-xs font-medium"
          />
        </form>

        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: "All Actions" },
            { id: "SUSPEND_USER", label: "Suspensions" },
            { id: "REACTIVATE_USER", label: "Reactivations" },
            { id: "UPDATE_PLATFORM_SETTING", label: "Settings" },
            { id: "UPDATE_SUBSCRIPTION_PLAN", label: "Plans" },
          ].map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setActionFilter(a.id);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                actionFilter === a.id
                  ? "bg-[#0F766E] text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">Action</th>
                <th className="p-4">Admin</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Client IP</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          log.action.includes("SUSPEND")
                            ? "bg-rose-100 text-rose-800"
                            : log.action.includes("REACTIVATE")
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-[#E0F2F1] text-[#0F766E]"
                        }`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-800 font-bold truncate max-w-[180px]">
                      {log.adminEmail}
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="space-y-0.5">
                        <span className="font-bold">{log.targetEntity}</span>
                        {log.targetId && (
                          <p className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                            {log.targetId}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || "internal"}
                    </td>

                    <td className="p-4 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectLog(log)}
                        className="h-8 px-2 text-xs font-bold text-[#0F766E] hover:text-[#0D6B63] hover:bg-[#E0F2F1]/50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Log Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-black text-base text-slate-900">
                  Audit Payload: {inspectLog.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Admin Email:</span>
                <span className="font-mono font-bold text-slate-900">{inspectLog.adminEmail}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Target Entity &amp; ID:</span>
                <span className="font-mono text-slate-900">
                  {inspectLog.targetEntity} {inspectLog.targetId ? `(${inspectLog.targetId})` : ""}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Client IP:</span>
                <span className="font-mono text-slate-900">{inspectLog.ipAddress || "internal"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-bold">Timestamp:</span>
                <span className="font-mono text-slate-900">
                  {new Date(inspectLog.createdAt).toISOString()}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700">Audit Details JSON</label>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 leading-relaxed">
                {JSON.stringify(inspectLog.details, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectLog(null)}
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

