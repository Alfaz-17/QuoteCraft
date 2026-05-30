import { QuotationState } from "@/types/quotation.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toTitleCase, cleanText, capitalizeFirst } from "@/utils/formatters";
import { Switch } from "@/components/ui/switch";

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

  const formatField = (value: string, type: "name" | "address" | "text") => {
    if (!autoFormat) return value;
    const cleaned = cleanText(value);
    if (type === "name") return toTitleCase(cleaned);
    if (type === "address") return capitalizeFirst(cleaned);
    return cleaned;
  };
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold uppercase text-primary tracking-tighter">Auto-Format</span>
            <Switch 
              checked={autoFormat} 
              onCheckedChange={setAutoFormat}
              className="h-4 w-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {!hideCompany && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Details</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={company.name}
                  onChange={(e) => onUpdateCompany({ name: e.target.value })}
                  onBlur={(e) => onUpdateCompany({ name: formatField(e.target.value, "name") })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="companyAddress">Address</Label>
                <Input
                  id="companyAddress"
                  value={company.address}
                  onChange={(e) => onUpdateCompany({ address: e.target.value })}
                  onBlur={(e) => onUpdateCompany({ address: formatField(e.target.value, "address") })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    value={company.phone}
                    onChange={(e) => onUpdateCompany({ phone: e.target.value })}
                    onBlur={(e) => onUpdateCompany({ phone: cleanText(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    value={company.email}
                    onChange={(e) => onUpdateCompany({ email: e.target.value })}
                    onBlur={(e) => onUpdateCompany({ email: cleanText(e.target.value).toLowerCase() })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="companyWebsite">Website</Label>
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
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Client Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="clientName">Contact Person</Label>
                  <Input
                    id="clientName"
                    value={client.name}
                    onChange={(e) => onUpdateClient({ name: e.target.value })}
                    onBlur={(e) => onUpdateClient({ name: formatField(e.target.value, "name") })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clientAttn">Attention (Attn)</Label>
                  <Input
                    id="clientAttn"
                    value={client.attn || ""}
                    onChange={(e) => onUpdateClient({ attn: e.target.value })}
                    onBlur={(e) => onUpdateClient({ attn: formatField(e.target.value, "name") })}
                    placeholder="e.g. Purchasing Manager"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientCompanyName">Client Company</Label>
                <Input
                  id="clientCompanyName"
                  value={client.companyName || ""}
                  onChange={(e) => onUpdateClient({ companyName: e.target.value })}
                  onBlur={(e) => onUpdateClient({ companyName: formatField(e.target.value, "name") })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientAddress">Address</Label>
                <Input
                  id="clientAddress"
                  value={client.address}
                  onChange={(e) => onUpdateClient({ address: e.target.value })}
                  onBlur={(e) => onUpdateClient({ address: formatField(e.target.value, "address") })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
