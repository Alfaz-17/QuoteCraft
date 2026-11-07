"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Building,
  Mail,
  Calendar,
  FileSpreadsheet,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  total_quotes: number;
  total_ai_extractions: number;
  total_ai_cost: number;
}

export const dynamic = "force-dynamic";

export default function AdminCustomersPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal for Suspend / Reactivate action
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [actionType, setActionType] = useState<"SUSPEND" | "REACTIVATE">("SUSPEND");
  const [actionReason, setActionReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        search,
      });

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load customer list");
      const json = await res.json();
      setCustomers(json.customers || []);
      setTotalCount(json.pagination.total);
      setTotalPages(json.pagination.totalPages || 1);
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: actionType,
          reason: actionReason,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Action failed");
      }

      toastSuccess(
        `User account ${actionType === "SUSPEND" ? "suspended" : "reactivated"} successfully.`
      );
      setSelectedUser(null);
      setActionReason("");
      fetchCustomers();
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Action failed");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Management
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage customer accounts, inspect company information, and handle access suspensions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchCustomers()}
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
            placeholder="Search by customer name, email, or company..."
            className="pl-9 h-11 bg-white border-slate-200 rounded-xl text-xs font-medium"
          />
        </form>

        <div className="flex items-center gap-2">
          {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s
                  ? "bg-[#0F766E] text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {s === "ALL" ? "All Accounts" : s === "ACTIVE" ? "Active" : "Suspended"}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">Customer</th>
                <th className="p-4">Company</th>
                <th className="p-4">Role &amp; Status</th>
                <th className="p-4 text-center">Quotes</th>
                <th className="p-4 text-center">AI Extractions</th>
                <th className="p-4">Registered</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading && customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No customers found matching current filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0">
                          {(c.name?.[0] || c.email[0] || "U").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {c.name || "Unnamed User"}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate font-mono">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {c.company_name ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 truncate">{c.company_name}</p>
                          {c.company_phone && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {c.company_phone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {c.status}
                        </span>
                        {c.role === "SUPER_ADMIN" && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                            SUPER ADMIN
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center font-bold text-slate-900">
                      {c.total_quotes}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-900">{c.total_ai_extractions}</span>
                        {c.total_ai_cost > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ${c.total_ai_cost.toFixed(3)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="p-4 text-right">
                      {c.role === "SUPER_ADMIN" ? (
                        <span className="text-[10px] text-slate-400 italic font-semibold">Owner</span>
                      ) : c.status === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(c);
                            setActionType("SUSPEND");
                            setActionReason("");
                          }}
                          className="h-8 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(c);
                            setActionType("REACTIVATE");
                            setActionReason("");
                          }}
                          className="h-8 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Reactivate
                        </Button>
                      )}
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

      {/* Confirmation Modal for Suspend / Reactivate */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {actionType === "SUSPEND" ? (
                  <UserX className="w-5 h-5 text-rose-600" />
                ) : (
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="font-black text-base text-slate-900">
                  {actionType === "SUSPEND" ? "Suspend Customer Account" : "Reactivate Customer"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to {actionType.toLowerCase()}{" "}
              <strong className="text-slate-900">{selectedUser.email}</strong>?{" "}
              {actionType === "SUSPEND"
                ? "The customer will be blocked from logging in and generating new quotations. This action is fully reversible."
                : "The customer will regain full access to their quotations and account."}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Internal Reason (Logged in Audit)</label>
              <Input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Terms violation, requested by customer, billing dispute..."
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingAction}
                onClick={handleConfirmAction}
                className={`rounded-xl font-bold text-white text-xs ${
                  actionType === "SUSPEND"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#0F766E] hover:bg-[#0D6B63]"
                }`}
              >
                {isSubmittingAction
                  ? "Processing..."
                  : actionType === "SUSPEND"
                  ? "Confirm Suspension"
                  : "Confirm Reactivation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

