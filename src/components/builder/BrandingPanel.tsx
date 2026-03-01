"use client";

import { useState } from "react";
import { QuotationState } from "@/types/quotation.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Check, AlertCircle } from "lucide-react";

interface BrandingPanelProps {
  branding: QuotationState["branding"];
  onUpdate: (updates: Partial<QuotationState["branding"]>) => void;
}

interface AIColors {
  primary: string;
  secondary: string;
  textColor: string;
}

export function BrandingPanel({ branding, onUpdate }: BrandingPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiColors, setAiColors] = useState<AIColors | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const analyzeWithAI = async (base64: string) => {
    setIsAnalyzing(true);
    setAiColors(null);
    setAiError(null);
    setApplied(false);
    try {
      const response = await fetch("/api/ai/analyze-logo", {
        method: "POST",
        body: JSON.stringify({ image: base64 }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.primary && data.secondary) {
        const colors: AIColors = {
          primary: data.primary,
          secondary: data.secondary,
          textColor: data.textColor || "#1e293b",
        };
        setAiColors(colors);
        // Auto-apply the colors
        onUpdate({
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          textColor: colors.textColor,
        });
        setApplied(true);
      } else {
        throw new Error("Could not extract colors from logo");
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("AI Analysis failed:", error);
      setAiError(error.message || "Failed to analyze logo");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onUpdate({ logo: result });
        analyzeWithAI(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyAIColors = () => {
    if (aiColors) {
      onUpdate({
        primaryColor: aiColors.primary,
        secondaryColor: aiColors.secondary,
        textColor: aiColors.textColor,
      });
      setApplied(true);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold">Branding</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label htmlFor="logo">Upload Logo</Label>
          <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} />
        </div>

        {/* Logo Preview */}
        {branding.logo && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border">
            <img src={branding.logo} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white border p-1" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Logo uploaded</p>
              {isAnalyzing && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-[10px] text-primary font-medium animate-pulse">AI analyzing colors...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Analyzed Color Palette */}
        {aiColors && !isAnalyzing && (
          <div className="p-3 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">AI Detected Palette</span>
              </div>
              {applied ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Applied
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={handleApplyAIColors} className="h-6 text-[10px] rounded-full gap-1">
                  Apply Colors
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-10 rounded-lg shadow-sm border border-white/50" style={{ backgroundColor: aiColors.primary }} />
                <span className="text-[9px] font-mono font-bold text-muted-foreground">{aiColors.primary}</span>
                <span className="text-[8px] text-muted-foreground">Primary</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-10 rounded-lg shadow-sm border border-white/50" style={{ backgroundColor: aiColors.secondary }} />
                <span className="text-[9px] font-mono font-bold text-muted-foreground">{aiColors.secondary}</span>
                <span className="text-[8px] text-muted-foreground">Secondary</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-10 rounded-lg shadow-sm border border-white/50" style={{ backgroundColor: aiColors.textColor }} />
                <span className="text-[9px] font-mono font-bold text-muted-foreground">{aiColors.textColor}</span>
                <span className="text-[8px] text-muted-foreground">Text</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Error */}
        {aiError && !isAnalyzing && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] font-medium">{aiError}</span>
          </div>
        )}

        {/* Manual Color Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input id="primaryColor" type="color" value={branding.primaryColor} onChange={(e) => onUpdate({ primaryColor: e.target.value })} className="w-12 h-10 p-1" />
              <Input type="text" value={branding.primaryColor} onChange={(e) => onUpdate({ primaryColor: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input id="secondaryColor" type="color" value={branding.secondaryColor} onChange={(e) => onUpdate({ secondaryColor: e.target.value })} className="w-12 h-10 p-1" />
              <Input type="text" value={branding.secondaryColor} onChange={(e) => onUpdate({ secondaryColor: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="textColor">Text Color</Label>
            <div className="flex gap-2">
              <Input id="textColor" type="color" value={branding.textColor} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-12 h-10 p-1" />
              <Input type="text" value={branding.textColor} onChange={(e) => onUpdate({ textColor: e.target.value })} className="flex-1" />
            </div>
          </div>
        </div>

        {/* Font Family - Visual Preview */}
        <div className="space-y-2">
          <Label>Font Family</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Inter", sample: "Modern & Clean" },
              { name: "Roboto", sample: "Professional" },
              { name: "Open Sans", sample: "Friendly & Open" },
              { name: "Montserrat", sample: "Bold & Elegant" },
            ].map((font) => (
              <button
                key={font.name}
                onClick={() => onUpdate({ font: font.name })}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  branding.font === font.name
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <p className="text-sm font-bold" style={{ fontFamily: font.name }}>{font.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: font.name }}>
                  {font.sample} — Aa Bb Cc 123
                </p>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

