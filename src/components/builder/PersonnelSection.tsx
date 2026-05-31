import { QuotationState } from "@/types/quotation.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useState } from "react";
import { toTitleCase, cleanText, capitalizeFirst } from "@/utils/formatters";


interface PersonnelSectionProps {
  company: QuotationState["company"];
  client: QuotationState["client"];
  onUpdateCompany: (updates: Partial<QuotationState["company"]>) => void;
  onUpdateClient: (updates: Partial<QuotationState["client"]>) => void;
  hideCompany?: boolean;
  hideClient?: boolean;
  title?: string;
  showCustomerDetails?: boolean;
  onToggleCustomerDetails?: (show: boolean) => void;
}

export function PersonnelSection({ 
  company, 
  client, 
  onUpdateCompany, 
  onUpdateClient,
  hideCompany = false,
  hideClient = false,
  title = "Company & Client",
  showCustomerDetails = true,
  onToggleCustomerDetails
}: PersonnelSectionProps) {
  const [autoFormat, setAutoFormat] = useState(true);
  const labelClass = "text-[11px] font-black uppercase tracking-widest text-slate-500";
  const hintClass = "text-[10px] font-semibold text-slate-400";

  const formatField = (value: string, type: "name" | "address" | "text") => {
    if (!autoFormat) return value;
    const cleaned = cleanText(value);
    if (type === "name") return toTitleCase(cleaned);
    if (type === "address") return capitalizeFirst(cleaned);
    return cleaned;
  };
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-2 md:pb-3 flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm md:text-lg font-semibold truncate">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4 md:space-y-6">
        {!hideCompany && (
          <div className="rounded-xl border bg-white/80 p-3 shadow-sm space-y-3 md:space-y-4">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Your Business Details</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="companyName" className={labelClass}>Company Name</Label>
                <Input
                  id="companyName"
                  value={company.name}
                  onChange={(e) => onUpdateCompany({ name: e.target.value })}
                  onBlur={(e) => onUpdateCompany({ name: formatField(e.target.value, "name") })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="companyAddress" className={labelClass}>Company Address</Label>
                <Input
                  id="companyAddress"
                  value={company.address}
                  onChange={(e) => onUpdateCompany({ address: e.target.value })}
                  onBlur={(e) => onUpdateCompany({ address: formatField(e.target.value, "address") })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                <div className="space-y-1 min-w-0">
                  <Label htmlFor="companyPhone" className={labelClass}>Phone</Label>
                  <Input
                    id="companyPhone"
                    value={company.phone}
                    onChange={(e) => onUpdateCompany({ phone: e.target.value })}
                    onBlur={(e) => onUpdateCompany({ phone: cleanText(e.target.value) })}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label htmlFor="companyEmail" className={labelClass}>Email</Label>
                  <Input
                    id="companyEmail"
                    value={company.email}
                    onChange={(e) => onUpdateCompany({ email: e.target.value })}
                    onBlur={(e) => onUpdateCompany({ email: cleanText(e.target.value).toLowerCase() })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="companyWebsite" className={labelClass}>Website</Label>
                <Input
                  id="companyWebsite"
                  value={company.website || ""}
                  onChange={(e) => onUpdateCompany({ website: e.target.value })}
                  onBlur={(e) => onUpdateCompany({ website: cleanText(e.target.value).toLowerCase() })}
                  placeholder="e.g. www.spiceship.com"
                />
              </div>
            </div>
          </div>
        )}

        {!hideCompany && !hideClient && <Separator />}

        {!hideClient && (
          <div className="rounded-xl border bg-white/80 p-3 shadow-sm space-y-3 md:space-y-4">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Customer Details</h3>
            <div className="space-y-3">
              <div className="space-y-1 min-w-0">
                <Label htmlFor="clientName" className={labelClass}>Contact Person</Label>
                <Input
                  id="clientName"
                  value={client.name}
                  onChange={(e) => onUpdateClient({ name: e.target.value })}
                  onBlur={(e) => onUpdateClient({ name: formatField(e.target.value, "name") })}
                />
                <p className={hintClass}>Person who will receive this document.</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientCompanyName" className={labelClass}>Customer Company</Label>
                <Input
                  id="clientCompanyName"
                  value={client.companyName || ""}
                  onChange={(e) => onUpdateClient({ companyName: e.target.value })}
                  onBlur={(e) => onUpdateClient({ companyName: formatField(e.target.value, "name") })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
