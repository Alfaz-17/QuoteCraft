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
        {/* Document Type & Number */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="docType" className="text-xs">Document Type</Label>
            <Select value={data.type} onValueChange={(v) => onUpdate({ type: v as DocumentInfoFormProps["data"]["type"] })}>
              <SelectTrigger id="docType" className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quotation">Quotation</SelectItem>
                <SelectItem value="rfq">RFQ</SelectItem>
                <SelectItem value="proforma">Proforma Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="docNumber" className="text-xs">Document No.</Label>
            <Input id="docNumber" value={data.number} onChange={(e) => onUpdate({ number: e.target.value })} className="h-9 font-mono text-xs" placeholder="QT-1001" />
          </div>
        </div>

        {/* Dates */}
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

        {/* Vessel & Reference */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vessel" className="text-xs">Vessel Name</Label>
            <Input id="vessel" value={data.vessel || ""} onChange={(e) => onUpdate({ vessel: e.target.value })} placeholder="e.g. MV Sea Star" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference" className="text-xs">Reference</Label>
            <Input id="reference" value={data.reference || ""} onChange={(e) => onUpdate({ reference: e.target.value })} placeholder="e.g. INQ-2024-0451" className="h-9" />
          </div>
        </div>

        {/* Machine Info - controlled by Settings toggle, no inline toggle here */}
        {showMachineInfo && (
          <>
            <Separator className="my-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Machine Information</p>
            <div className="space-y-3">
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
