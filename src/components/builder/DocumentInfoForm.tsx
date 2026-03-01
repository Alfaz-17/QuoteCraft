"use client";

import { QuotationState } from "@/types/quotation.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface DocumentInfoFormProps {
  data: QuotationState["documentInfo"];
  onUpdate: (updates: Partial<QuotationState["documentInfo"]>) => void;
  showMachineInfo?: boolean;
}

export function DocumentInfoForm({ data, onUpdate, showMachineInfo = true }: DocumentInfoFormProps) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-semibold">Document Details</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs">Date</Label>
            <Input id="date" type="date" value={data.date} onChange={(e) => onUpdate({ date: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validUntil" className="text-xs">Valid Until</Label>
            <Input id="validUntil" type="date" value={data.validUntil} onChange={(e) => onUpdate({ validUntil: e.target.value })} className="h-9" />
          </div>
        </div>

        {/* Machine Info - controlled by Settings toggle, no inline toggle here */}
        {showMachineInfo && (
          <>
            <Separator className="my-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Machine Information</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="scope" className="text-xs">Scope of Supply</Label>
                <Input id="scope" value={data.scope || ""} onChange={(e) => onUpdate({ scope: e.target.value })} placeholder="e.g. MAIN ENGINE SPARES" className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="make" className="text-xs">Make</Label>
                  <Input id="make" value={data.make || ""} onChange={(e) => onUpdate({ make: e.target.value })} placeholder="e.g. WARTSILA" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model" className="text-xs">Model</Label>
                  <Input id="model" value={data.model || ""} onChange={(e) => onUpdate({ model: e.target.value })} placeholder="e.g. 6L20" className="h-9" />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
