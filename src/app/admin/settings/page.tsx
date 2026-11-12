"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/Toast";

interface AiEngineControls {
  dailyAiLimitPerUser: number;
  groqModel: string;
  maxUploadSizeMb: number;
  enableVisionFallback: boolean;
}

const DEFAULT_MODEL = "qwen/qwen3.8-27b";
const MODELS = [
  { value: DEFAULT_MODEL, label: "Qwen 3.8 27B (recommended)" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (fastest)" },
];

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existing, setExisting] = useState<Partial<AiEngineControls>>({});
  const [dailyAiLimit, setDailyAiLimit] = useState("5");
  const [groqModel, setGroqModel] = useState(DEFAULT_MODEL);
  const [enableVision, setEnableVision] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login?error=unauthorized");
          return;
        }
        if (!res.ok) throw new Error("Couldn't load settings.");
        const json = await res.json();
        const c = (json.settings?.ai_engine_controls || {}) as Partial<AiEngineControls>;
        setExisting(c);
        if (typeof c.dailyAiLimitPerUser === "number") setDailyAiLimit(String(c.dailyAiLimitPerUser));
        if (c.groqModel) setGroqModel(c.groqModel);
        setEnableVision(c.enableVisionFallback !== false);
      } catch (err: unknown) {
        toastError((err as Error)?.message || "Couldn't load settings.");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const limit = Number(dailyAiLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
      toastError("Daily AI limit must be a whole number between 1 and 10000.");
      return;
    }
    setIsSaving(true);
    try {
      const value: AiEngineControls = {
        dailyAiLimitPerUser: limit,
        groqModel: groqModel || DEFAULT_MODEL,
        maxUploadSizeMb: existing.maxUploadSizeMb ?? 10,
        enableVisionFallback: enableVision,
      };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ai_engine_controls", value }),
      });
      if (!res.ok) throw new Error("Couldn't save settings.");
      setExisting(value);
      toastSuccess("Settings saved.");
    } catch (err: unknown) {
      toastError((err as Error)?.message || "Couldn't save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const modelOptions = MODELS.some((m) => m.value === groqModel)
    ? MODELS
    : [...MODELS, { value: groqModel, label: groqModel }];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Controls for AI extraction. Changes apply immediately.</p>
      </div>

      {isLoading ? (
        <div className="h-72 rounded-xl bg-slate-200/60 animate-pulse" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          <div className="p-6 grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Label className="text-sm font-medium text-slate-900">Default daily AI limit</Label>
              <p className="text-xs text-slate-500 mt-1">
                AI extractions each customer can run per 24 hours. Excel and digital PDF imports are always unlimited.
              </p>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Input
                type="number"
                min={1}
                max={10000}
                step={1}
                value={dailyAiLimit}
                onChange={(e) => setDailyAiLimit(e.target.value)}
                className="h-10 max-w-[160px]"
              />
              <p className="text-xs text-slate-500">
                To give one customer a different limit, open Customers and click their limit badge.
              </p>
            </div>
          </div>

          <div className="p-6 grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Label className="text-sm font-medium text-slate-900">AI model</Label>
              <p className="text-xs text-slate-500 mt-1">Used to read scanned PDFs, images and messy text.</p>
            </div>
            <div className="sm:col-span-2">
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className="h-10 w-full max-w-sm px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800"
              >
                {modelOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6 grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Label className="text-sm font-medium text-slate-900">Image uploads</Label>
              <p className="text-xs text-slate-500 mt-1">Let customers upload photos or screenshots of RFQs.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={enableVision}
                    onChange={(e) => setEnableVision(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-[#0F766E] transition-colors" />
                  <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </span>
                <span className="text-sm text-slate-700">{enableVision ? "On" : "Off"}</span>
              </label>
            </div>
          </div>

          <div className="p-4 flex justify-end bg-slate-50/60 rounded-b-xl">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0F766E] hover:bg-[#0D6B63] text-white rounded-lg"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
