"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TermsSectionProps {
  terms: string;
  onUpdate: (terms: string) => void;
}

export function TermsSection({ terms, onUpdate }: TermsSectionProps) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold">Terms & Conditions</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="terms">Notes / Terms <span className="text-muted-foreground font-normal">(Optional)</span></Label>
          <Textarea
            id="terms"
            rows={6}
            value={terms}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder="Enter payment terms, delivery timelines, or other notes (optional)..."
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
