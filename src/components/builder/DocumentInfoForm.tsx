"use client";

import { QuotationState } from "@/types/quotation.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentInfoFormProps {
  data: QuotationState["documentInfo"];
  onUpdate: (updates: Partial<QuotationState["documentInfo"]>) => void;
  showMachineInfo?: boolean;
}

export function DocumentInfoForm({ data, onUpdate, showMachineInfo = true }: DocumentInfoFormProps) {
  const labelClass = "text-[12px] font-black text-slate-700";
  const hintClass = "text-[10px] font-semibold text-slate-400";

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-2 md:pb-3">
        <CardTitle className="text-sm md:text-base font-semibold">Document Details</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-3 md:space-y-4">
        {/* Document Type & Number */}
        <div className="rounded-xl border bg-white/80 p-3 shadow-sm space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Basic Document Info</p>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 md:gap-3">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="docType" className={labelClass}>Document Type</Label>
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
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="docNumber" className={labelClass}>Document Number</Label>
            <Input id="docNumber" value={data.number} onChange={(e) => onUpdate({ number: e.target.value })} className="h-9 font-mono text-xs" placeholder="QT-1001" />
            <p className={hintClass}>Shown on top of the quotation.</p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 md:gap-3">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="date" className={labelClass}>Issue Date</Label>
            <Input id="date" type="date" value={data.date} onChange={(e) => onUpdate({ date: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="validUntil" className={labelClass}>Valid Until</Label>
            <Input id="validUntil" type="date" value={data.validUntil} onChange={(e) => onUpdate({ validUntil: e.target.value })} className="h-9" />
            <p className={hintClass}>Last date this quote is valid.</p>
          </div>
        </div>
        </div>

        {/* Vessel & Reference */}
        <div className="rounded-xl border bg-white/80 p-3 shadow-sm space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Vessel / Enquiry Details</p>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 md:gap-3">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="vessel" className={labelClass}>Vessel Name</Label>
            <Input id="vessel" value={data.vessel || ""} onChange={(e) => onUpdate({ vessel: e.target.value })} placeholder="e.g. MV Sea Star" className="h-9" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="reference" className={labelClass}>Customer Reference</Label>
            <Input id="reference" value={data.reference || ""} onChange={(e) => onUpdate({ reference: e.target.value })} placeholder="e.g. INQ-2024-0451" className="h-9" />
            <p className={hintClass}>RFQ, enquiry, or buyer reference.</p>
          </div>
        </div>
        </div>

        {/* Machine Info - controlled by Settings toggle, no inline toggle here */}
        {showMachineInfo && (
          <>
            <div className="rounded-xl border bg-white/80 p-3 shadow-sm space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Machine Information</p>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 md:gap-3">
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="make" className={labelClass}>Maker / Brand</Label>
                  <Input id="make" value={data.make || ""} onChange={(e) => onUpdate({ make: e.target.value })} placeholder="e.g. WARTSILA" className="h-9" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="model" className={labelClass}>Model / Engine Type</Label>
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
