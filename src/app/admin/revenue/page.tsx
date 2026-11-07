"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Edit,
  ShieldCheck,
  RefreshCw,
  X,
  Plus,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/Toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  monthlyQuotationLimit: number;
  monthlyAiLimit: number;
  features: string[];
  isActive: boolean;
  updatedAt: string;
}

interface RevenueData {
  billingIntegrationStatus: {
    integrated: boolean;
    provider: string;
    message: string;
  };
  summary: {
    totalRegisteredUsers: number;
    activePaidSubscriptions: number;
    mrrUsd: number;
    totalRevenueUsd: number;
  };
  plans: SubscriptionPlan[];
}

export const dynamic = "force-dynamic";

export default function AdminRevenuePage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Plan modal state
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editName, setEditName] = useState("");
  const [editPriceMonthly, setEditPriceMonthly] = useState<number>(0);
  const [editPriceYearly, setEditPriceYearly] = useState<number>(0);
  const [editQuoteLimit, setEditQuoteLimit] = useState<number>(50);
  const [editAiLimit, setEditAiLimit] = useState<number>(30);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/revenue");
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load revenue data");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to load revenue data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditPriceMonthly(plan.priceMonthlyUsd);
    setEditPriceYearly(plan.priceYearlyUsd);
    setEditQuoteLimit(plan.monthlyQuotationLimit);
    setEditAiLimit(plan.monthlyAiLimit);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSavingPlan(true);

    try {
      const res = await fetch("/api/admin/revenue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: editingPlan.id,
          name: editName,
          priceMonthlyUsd: Number(editPriceMonthly),
          priceYearlyUsd: Number(editPriceYearly),
          monthlyQuotationLimit: Number(editQuoteLimit),
          monthlyAiLimit: Number(editAiLimit),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update plan");
      }

      toastSuccess(`Plan "${editName}" updated successfully!`);
      setEditingPlan(null);
      fetchRevenueData();
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to save plan");
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Revenue &amp; Subscription Plans
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure SaaS pricing models, monthly quota limits, and monitor monetization readiness.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchRevenueData}
          disabled={isLoading}
          className="self-start sm:self-auto h-9 px-3 rounded-xl border-slate-200 bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading && !data ? (
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* Honest Billing Integration Status Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-900 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="font-black text-sm">
                  Monetization Architecture: {data.billingIntegrationStatus.provider}
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {data.billingIntegrationStatus.message}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-bold text-amber-950">
                <span>• Total Users on Starter Quotas: {data.summary.totalRegisteredUsers}</span>
                <span>• Live MRR: $0.00 (Ready for Gateway)</span>
              </div>
            </div>

            {/* Configured Plans Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0F766E]" />
                    SaaS Subscription Tiers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click &apos;Edit Plan&apos; to modify monthly quotas, pricing, and AI extraction allocations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.plans.map((plan) => {
                  const isFree = plan.id === "free";
                  const isEnterprise = plan.id === "enterprise";

                  return (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-2xs space-y-4 transition-all relative overflow-hidden ${
                        plan.id === "marine_pro"
                          ? "border-[#0F766E] ring-1 ring-[#0F766E]/40"
                          : "border-slate-200"
                      }`}
                    >
                      {plan.id === "marine_pro" && (
                        <div className="absolute top-0 right-0 bg-[#0F766E] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                          Most Popular
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-lg text-slate-900">{plan.name}</h4>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                plan.isActive
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {plan.isActive ? "Active" : "Archived"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                        </div>

                        {/* Price Display */}
                        <div className="py-2 border-y border-slate-100 flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900">
                            ${plan.priceMonthlyUsd}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">/ month</span>
                          {plan.priceYearlyUsd > 0 && (
                            <span className="text-[11px] text-emerald-600 font-bold ml-auto">
                              ${plan.priceYearlyUsd}/yr
                            </span>
                          )}
                        </div>

                        {/* Quotas */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="font-bold">Monthly Quotes:</span>
                            <span className="font-mono font-black text-slate-900">
                              {plan.monthlyQuotationLimit.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="font-bold">Monthly AI Extractions:</span>
                            <span className="font-mono font-black text-[#0F766E]">
                              {plan.monthlyAiLimit.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Feature List */}
                        <div className="pt-2 space-y-1.5 border-t border-slate-100">
                          {Array.isArray(plan.features) &&
                            plan.features.map((feat, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex items-center gap-2 text-xs text-slate-600"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Edit CTA */}
                      <Button
                        variant="outline"
                        onClick={() => openEditModal(plan)}
                        className="w-full text-xs font-bold border-slate-200 hover:bg-slate-50 rounded-xl mt-4"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                        Edit Tier &amp; Quotas
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#0F766E]" />
                Edit Plan: {editingPlan.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Plan Display Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Monthly Price (USD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editPriceMonthly}
                    onChange={(e) => setEditPriceMonthly(Number(e.target.value))}
                    className="h-10 text-xs rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Yearly Price (USD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editPriceYearly}
                    onChange={(e) => setEditPriceYearly(Number(e.target.value))}
                    className="h-10 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Monthly Quotes Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editQuoteLimit}
                    onChange={(e) => setEditQuoteLimit(Number(e.target.value))}
                    className="h-10 text-xs rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Monthly AI Parses</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editAiLimit}
                    onChange={(e) => setEditAiLimit(Number(e.target.value))}
                    className="h-10 text-xs rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPlan(null)}
                  className="rounded-xl border-slate-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPlan}
                  className="rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold"
                >
                  {isSavingPlan ? "Saving Changes..." : "Save Plan Configuration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
