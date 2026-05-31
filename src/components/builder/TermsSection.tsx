"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TERMS_TEMPLATES } from "@/constants/termsTemplates";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TermsSectionProps {
  terms: string;
  onUpdate: (terms: string) => void;
}

export function TermsSection({ terms, onUpdate }: TermsSectionProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const insertTemplate = (text: string) => {
    const newTerms = terms ? `${terms}\n${text}` : text;
    onUpdate(newTerms);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-2 md:pb-3">
        <CardTitle className="text-sm md:text-lg font-semibold">Terms & Conditions</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-3 md:space-y-4">
        {/* Quick Templates */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full justify-between text-[11px] md:text-xs h-8 rounded-lg"
          >
            <span className="flex items-center gap-1.5">
              <span>⚡</span> Quick Insert Templates
            </span>
            {showTemplates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>

          {showTemplates && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {TERMS_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => insertTemplate(tmpl.text)}
                  className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg border bg-white hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                >
                  <span className="text-sm">{tmpl.emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors truncate">
                    {tmpl.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Terms Textarea */}
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="terms">Notes / Terms <span className="text-muted-foreground font-normal">(Optional)</span></Label>
          <Textarea
            id="terms"
            rows={8}
            value={terms}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder="Enter payment terms, delivery timelines, or other notes. Use the templates above for quick insertion..."
            className="resize-none text-xs leading-relaxed min-h-[120px] md:min-h-[160px]"
          />
        </div>

        {terms && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpdate("")}
            className="text-[10px] text-destructive/70 hover:text-destructive h-6 px-2"
          >
            Clear All Terms
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
