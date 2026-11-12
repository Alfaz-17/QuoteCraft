"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/Toast";

interface SupportTicket {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string | null;
  category: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState<{
    total: string;
    open_count: string;
    in_progress_count: string;
    resolved_count: string;
  }>({ total: "0", open_count: "0", in_progress_count: "0", resolved_count: "0" });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Ticket detail / edit modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [editStatus, setEditStatus] = useState<SupportTicket["status"]>("OPEN");
  const [editPriority, setEditPriority] = useState<SupportTicket["priority"]>("MEDIUM");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingTicket, setIsSavingTicket] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        category: categoryFilter,
        search,
      });

      const res = await fetch(`/api/admin/support?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load support requests");
      const json = await res.json();
      setTickets(json.tickets || []);
      setCounts(json.counts || { total: "0", open_count: "0", in_progress_count: "0", resolved_count: "0" });
      setTotalCount(json.pagination.total);
      setTotalPages(json.pagination.totalPages || 1);
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to load support tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, categoryFilter]);

  const openTicketModal = (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditNotes(ticket.internalNotes || "");
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    setIsSavingTicket(true);

    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          status: editStatus,
          priority: editPriority,
          internalNotes: editNotes,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update ticket");
      }

      toastSuccess("Support ticket updated successfully!");
      setActiveTicket(null);
      fetchTickets();
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to save ticket changes");
    } finally {
      setIsSavingTicket(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Support tickets
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              {counts.total} Tickets
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Messages and bug reports sent by customers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchTickets()}
          disabled={isLoading}
          className="self-start sm:self-auto h-9 px-3 rounded-xl border-slate-200 bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Ticket Status Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "ALL"
              ? "bg-[#0F766E] text-white border-[#0F766E] shadow-2xs"
              : "bg-white border-slate-200 text-slate-700"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">All Tickets</span>
          <span className="text-xl font-black">{counts.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("OPEN")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "OPEN"
              ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
              : "bg-white border-slate-200 text-amber-700"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Open / New</span>
          <span className="text-xl font-black">{counts.open_count}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
              : "bg-white border-slate-200 text-blue-700"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">In Progress</span>
          <span className="text-xl font-black">{counts.in_progress_count}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("RESOLVED")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "RESOLVED"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
              : "bg-white border-slate-200 text-emerald-700"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Resolved</span>
          <span className="text-xl font-black">{counts.resolved_count}</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by subject, message, or customer email..."
            className="pl-9 h-11 bg-white border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="TECHNICAL">Technical Issue</option>
          <option value="AI_EXTRACTION">AI Extraction Issue</option>
          <option value="BILLING">Billing &amp; Plans</option>
          <option value="FEATURE_REQUEST">Feature Request</option>
          <option value="FEEDBACK">General Feedback</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">Customer</th>
                <th className="p-4">Category</th>
                <th className="p-4">Subject &amp; Message</th>
                <th className="p-4">Priority &amp; Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No tickets found matching current filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 truncate max-w-[150px]">
                        {t.userName || "Customer"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                        {t.userEmail}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="text-[10px] font-bold text-teal-800 bg-[#E0F2F1] px-2 py-0.5 rounded uppercase">
                        {t.category.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-4 max-w-[280px]">
                      <p className="font-bold text-slate-900 truncate">{t.subject}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.message}</p>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            t.status === "OPEN"
                              ? "bg-amber-100 text-amber-800"
                              : t.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Priority: {t.priority}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTicketModal(t)}
                        className="h-8 px-2.5 text-xs font-bold text-[#0F766E] hover:text-[#0D6B63] hover:bg-[#E0F2F1]/50"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Manage
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

      {/* Ticket Management Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-black text-base text-slate-900">
                  Manage Support Ticket
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Message Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{activeTicket.userName}</span>
                <span className="font-mono text-slate-500">{activeTicket.userEmail}</span>
              </div>
              <p className="font-extrabold text-sm text-slate-900">{activeTicket.subject}</p>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {activeTicket.message}
              </p>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Status</Label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SupportTicket["status"])}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Priority</Label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as SupportTicket["priority"])}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Internal notes (private)
                </Label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes on resolution, customer response, or follow-up..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0F766E] outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTicket(null)}
                  className="rounded-xl border-slate-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingTicket}
                  className="rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold"
                >
                  {isSavingTicket ? "Saving..." : "Save Ticket Status"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

