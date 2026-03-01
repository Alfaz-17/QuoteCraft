"use client";

import { useState } from "react";
import { QuotationState } from "@/types/quotation.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BrandingPanelProps {
  branding: QuotationState["branding"];
  onUpdate: (updates: Partial<QuotationState["branding"]>) => void;
}

export function BrandingPanel({ branding, onUpdate }: BrandingPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWithAI = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-logo", {
        method: "POST",
        body: JSON.stringify({ image: base64 }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.primary && data.secondary) {
        onUpdate({ 
          primaryColor: data.primary, 
          secondaryColor: data.secondary,
          ...(data.textColor && { textColor: data.textColor }),
        });
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
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

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold">Branding</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">Upload Logo</Label>
          <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={branding.primaryColor}
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="textColor">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="textColor"
                type="color"
                value={branding.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={branding.textColor}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font">Font Family</Label>
          <Select value={branding.font} onValueChange={(v) => onUpdate({ font: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="layout">Template Layout</Label>
          <Select value={branding.layout} onValueChange={(v: any) => onUpdate({ layout: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Classic Corporate</SelectItem>
              <SelectItem value="minimal">Minimal Clean</SelectItem>
              <SelectItem value="technical">Technical / Industrial</SelectItem>
              <SelectItem value="marine">Professional Marine RFQ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
