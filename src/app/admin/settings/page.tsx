"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sliders,
  Save,
  ShieldAlert,
  Bell,
  Sparkles,
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/Toast";

interface SettingsMap {
  platform_branding?: {
    platformName: string;
    tagline: string;
    primaryColor: string;
    accentColor: string;
  };
  free_tier_limits?: {
    monthlyQuotations: number;
    monthlyAiExtractions: number;
    maxFileSizeMb: number;
  };
  ai_engine_controls?: {
    dailyAiLimitPerUser: number;
    groqModel: string;
    maxUploadSizeMb: number;
    enableVisionFallback: boolean;
  };
  maintenance_mode?: {
    enabled: boolean;
    message: string;
  };
  announcements?: {
    active: boolean;
    bannerText: string;
    bannerType: "info" | "warning" | "success";
  };
}

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [settings, setSettings] = useState<SettingsMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [platformName, setPlatformName] = useState("QuoteCraft");
  const [tagline, setTagline] = useState("From Enquiry to Quotation, Faster");
  const [primaryColor, setPrimaryColor] = useState("#0F766E");
  const [accentColor, setAccentColor] = useState("#F59E0B");

  const [freeQuotes, setFreeQuotes] = useState(50);
  const [freeAi, setFreeAi] = useState(30);
  const [maxFileSize, setMaxFileSize] = useState(10);

  // AI Engine Controls
  const [dailyAiLimit, setDailyAiLimit] = useState(5);
  const [groqModel, setGroqModel] = useState("qwen/qwen3.8-27b");
  const [aiMaxUploadMb, setAiMaxUploadMb] = useState(10);
  const [enableVision, setEnableVision] = useState(true);

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");

  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success">("info");

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login?error=unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Failed to load platform settings");
      const json = await res.json();
      const s = json.settings as SettingsMap;
      setSettings(s);

      if (s.platform_branding) {
        setPlatformName(s.platform_branding.platformName || "QuoteCraft");
        setTagline(s.platform_branding.tagline || "");
        setPrimaryColor(s.platform_branding.primaryColor || "#0F766E");
        setAccentColor(s.platform_branding.accentColor || "#F59E0B");
      }

      if (s.free_tier_limits) {
        setFreeQuotes(s.free_tier_limits.monthlyQuotations || 50);
        setFreeAi(s.free_tier_limits.monthlyAiExtractions || 30);
        setMaxFileSize(s.free_tier_limits.maxFileSizeMb || 10);
      }

      if (s.ai_engine_controls) {
        setDailyAiLimit(s.ai_engine_controls.dailyAiLimitPerUser || 5);
        setGroqModel(s.ai_engine_controls.groqModel || "qwen/qwen3.8-27b");
        setAiMaxUploadMb(s.ai_engine_controls.maxUploadSizeMb || 10);
        setEnableVision(s.ai_engine_controls.enableVisionFallback !== false);
      }

      if (s.maintenance_mode) {
        setMaintenanceEnabled(!!s.maintenance_mode.enabled);
        setMaintenanceMsg(s.maintenance_mode.message || "");
      }

      if (s.announcements) {
        setAnnouncementActive(!!s.announcements.active);
        setAnnouncementText(s.announcements.bannerText || "");
        setAnnouncementType(s.announcements.bannerType || "info");
      }
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSetting = async (key: string, value: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) throw new Error("Failed to save setting");
      toastSuccess(`Setting "${key}" updated successfully!`);
      fetchSettings();
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#0F766E]" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Platform Configuration &amp; Feature Flags
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Global SaaS branding, emergency maintenance switch, and global broadcast announcements.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={isLoading}
          className="self-start sm:self-auto h-9 px-3 rounded-xl border-slate-200 bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading && !settings ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: GLOBAL BRANDING */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F766E]" />
                1. Global Platform Branding
              </h3>
              <p className="text-xs text-slate-500">
                Brand identity parameters rendered across customer screens and generated PDF quotations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Platform Name</Label>
                <Input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Platform Tagline</Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Primary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer p-0.5 border border-slate-200"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 text-xs font-mono font-bold uppercase rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Gold Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer p-0.5 border border-slate-200"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 text-xs font-mono font-bold uppercase rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  saveSetting("platform_branding", {
                    platformName,
                    tagline,
                    primaryColor,
                    accentColor,
                  })
                }
                className="bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold rounded-xl"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Branding Settings
              </Button>
            </div>
          </div>

          {/* SECTION 2: DEFAULT FREE TIER LIMITS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0F766E]" />
                2. Default Starter Quotas
              </h3>
              <p className="text-xs text-slate-500">
                Default allowances assigned to newly registered customer accounts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Monthly Quotations</Label>
                <Input
                  type="number"
                  min="1"
                  value={freeQuotes}
                  onChange={(e) => setFreeQuotes(Number(e.target.value))}
                  className="h-10 text-xs font-mono rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Monthly AI Extractions</Label>
                <Input
                  type="number"
                  min="0"
                  value={freeAi}
                  onChange={(e) => setFreeAi(Number(e.target.value))}
                  className="h-10 text-xs font-mono rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Max Upload Size (MB)</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(Number(e.target.value))}
                  className="h-10 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  saveSetting("free_tier_limits", {
                    monthlyQuotations: freeQuotes,
                    monthlyAiExtractions: freeAi,
                    maxFileSizeMb: maxFileSize,
                  })
                }
                className="bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold rounded-xl"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Starter Quotas
              </Button>
            </div>
          </div>

          {/* SECTION 3: AI ENGINE CONTROLS (Groq) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0F766E]" />
                3. AI Extraction Engine Controls
              </h3>
              <p className="text-xs text-slate-500">
                Configure Groq AI daily quotas, model selection, and upload limits.
                Deterministic Excel and digital PDF imports are always unlimited at $0.00 cost.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Daily AI Limit (per user)</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={dailyAiLimit}
                  onChange={(e) => setDailyAiLimit(Number(e.target.value))}
                  className="h-10 text-xs font-mono rounded-xl"
                />
                <p className="text-[10px] text-slate-400">
                  AI fallback requests per user per 24 hours. Does not affect deterministic parsing.
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Groq Model</Label>
                <select
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="qwen/qwen3.8-27b">Qwen 3.8-27B (Default — High Accuracy Marine Table)</option>
                  <option value="llama-3.3-70b-versatile">Llama 3.3-70B Versatile (Large Context)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1-8B Instant (Ultra-fast)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Active Groq model used for AI fallback extraction. Changes take effect immediately at runtime.
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Max Upload Size (MB)</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={aiMaxUploadMb}
                  onChange={(e) => setAiMaxUploadMb(Number(e.target.value))}
                  className="h-10 text-xs font-mono rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Image Vision Fallback</Label>
                <div className="flex items-center gap-3 h-10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableVision}
                      onChange={(e) => setEnableVision(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
                  </label>
                  <span className="text-xs font-semibold text-slate-600">
                    {enableVision ? "Enabled — accept image uploads" : "Disabled — text & files only"}
                  </span>
                </div>
              </div>
            </div>

            {/* Live quota info box */}
            <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/50 text-xs text-teal-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Current Engine: Groq AI — {groqModel}
              </p>
              <p className="text-[11px] text-teal-600">
                Each user gets <span className="font-black">{dailyAiLimit}</span> AI-powered extraction{dailyAiLimit === 1 ? "" : "s"} per day.
                Unlimited zero-cost deterministic imports for Excel (.xlsx) and digital PDFs remain unaffected.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  saveSetting("ai_engine_controls", {
                    dailyAiLimitPerUser: dailyAiLimit,
                    groqModel,
                    maxUploadSizeMb: aiMaxUploadMb,
                    enableVisionFallback: enableVision,
                  })
                }
                className="bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold rounded-xl"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save AI Engine Settings
              </Button>
            </div>
          </div>

          {/* SECTION 4: EMERGENCY MAINTENANCE MODE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  4. Scheduled Maintenance Mode
                </h3>
                <p className="text-xs text-slate-500">
                  When enabled, non-admin visitors see a maintenance window instead of the builder.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceEnabled}
                  onChange={(e) => setMaintenanceEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
              </label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Maintenance Broadcast Message</Label>
              <Input
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                placeholder="QuoteCraft is undergoing scheduled maintenance. We will be back shortly."
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  saveSetting("maintenance_mode", {
                    enabled: maintenanceEnabled,
                    message: maintenanceMsg,
                  })
                }
                className="bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold rounded-xl"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Maintenance State
              </Button>
            </div>
          </div>

          {/* SECTION 5: GLOBAL ANNOUNCEMENT BANNER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  5. Top Announcement Broadcast
                </h3>
                <p className="text-xs text-slate-500">
                  Broadcast a banner message to all logged-in suppliers in real-time.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-bold text-slate-700">Announcement Text</Label>
                <Input
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. New Feature: AI Excel extraction now supports custom IMPA code columns!"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Banner Style</Label>
                <select
                  value={announcementType}
                  onChange={(e) => setAnnouncementType(e.target.value as "info" | "warning" | "success")}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="info">Informational (Teal)</option>
                  <option value="warning">Important Alert (Amber)</option>
                  <option value="success">Feature Release (Emerald)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  saveSetting("announcements", {
                    active: announcementActive,
                    bannerText: announcementText,
                    bannerType: announcementType,
                  })
                }
                className="bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold rounded-xl"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Announcement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

