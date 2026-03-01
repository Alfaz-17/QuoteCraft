"use client";

import { useQuotationState } from "@/hooks/useQuotationState";
import { BrandingPanel } from "@/components/builder/BrandingPanel";
import { PersonnelSection } from "@/components/builder/PersonnelSection";
import { TermsSection } from "@/components/builder/TermsSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building2, Palette, FileText, LayoutGrid, Cpu, Plus, X, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableColumn } from "@/types/quotation.types";
import { useState } from "react";

export default function SettingsPage() {
  const { state, dispatch } = useQuotationState();
  const [newColName, setNewColName] = useState("");

  const handleUpdateBranding = (updates: any) => dispatch({ type: "SET_BRANDING", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const handleUpdateCompany = (updates: any) => dispatch({ type: "SET_COMPANY", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const handleUpdateTerms = (terms: string) => dispatch({ type: "SET_TERMS", payload: terms });
  const handleToggleSection = (section: keyof typeof state.builderConfig, value: boolean) =>
    dispatch({ type: "SET_BUILDER_CONFIG", payload: { [section]: value } });

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const key = newColName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const col: TableColumn = {
      id: `custom_${Date.now()}`,
      label: newColName.trim(),
      key,
      type: "text",
      visible: true,
      width: "100px",
    };
    dispatch({ type: "ADD_COLUMN", payload: col });
    setNewColName("");
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
      <header className="h-14 border-b bg-white flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold">Settings</h2>
            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Company & Builder Config</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          {/* Visual Branding */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Palette className="w-4 h-4" />
              <h3 className="font-bold text-sm">Visual Branding</h3>
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Always Visible</span>
            </div>
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardContent className="p-5">
                <BrandingPanel branding={state.branding} onUpdate={handleUpdateBranding} />
              </CardContent>
            </Card>
          </section>

          <Separator className="bg-primary/10" />

          {/* Business Profile */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="w-4 h-4" />
                <h3 className="font-bold text-sm">Business Profile</h3>
              </div>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border shadow-sm">
                <Label htmlFor="show-bp" className="text-[9px] font-bold uppercase tracking-tight">Show</Label>
                <Switch id="show-bp" checked={state.builderConfig.showBusinessProfile} onCheckedChange={(v) => handleToggleSection("showBusinessProfile", v)} className="scale-[0.65]" />
              </div>
            </div>
            <Card className={`border-none shadow-sm transition-all duration-300 ${!state.builderConfig.showBusinessProfile ? "opacity-40 grayscale" : "bg-white/50"}`}>
              <CardContent className="p-5">
                <PersonnelSection company={state.company} client={state.client} onUpdateCompany={handleUpdateCompany} onUpdateClient={() => {}} hideClient={true} />
              </CardContent>
            </Card>
          </section>

          <Separator className="bg-primary/10" />

          {/* Machine Information */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Cpu className="w-4 h-4" />
                <h3 className="font-bold text-sm">Machine Information</h3>
              </div>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border shadow-sm">
                <Label htmlFor="show-mi" className="text-[9px] font-bold uppercase tracking-tight">Show</Label>
                <Switch id="show-mi" checked={state.builderConfig.showMachineInfo} onCheckedChange={(v) => handleToggleSection("showMachineInfo", v)} className="scale-[0.65]" />
              </div>
            </div>
            <Card className={`border-none shadow-sm transition-all duration-300 ${!state.builderConfig.showMachineInfo ? "opacity-40 grayscale" : "bg-white/50"}`}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Scope, Make, and Model fields will be {state.builderConfig.showMachineInfo ? "visible" : "hidden"} in the builder.</p>
              </CardContent>
            </Card>
          </section>

          <Separator className="bg-primary/10" />

          {/* Client Info */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="w-4 h-4" />
                <h3 className="font-bold text-sm">Client Info</h3>
              </div>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border shadow-sm">
                <Label htmlFor="show-ci" className="text-[9px] font-bold uppercase tracking-tight">Show</Label>
                <Switch id="show-ci" checked={state.builderConfig.showClientInfo} onCheckedChange={(v) => handleToggleSection("showClientInfo", v)} className="scale-[0.65]" />
              </div>
            </div>
          </section>

          <Separator className="bg-primary/10" />

          {/* Parts Table - Dynamic Columns Config */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <LayoutGrid className="w-4 h-4" />
                <h3 className="font-bold text-sm">Parts Table</h3>
              </div>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border shadow-sm">
                <Label htmlFor="show-table" className="text-[9px] font-bold uppercase tracking-tight">Show</Label>
                <Switch id="show-table" checked={state.builderConfig.showTable} onCheckedChange={(v) => handleToggleSection("showTable", v)} className="scale-[0.65]" />
              </div>
            </div>
            <Card className={`border-none shadow-sm transition-all duration-300 ${!state.builderConfig.showTable ? "opacity-40 grayscale" : "bg-white/50"}`}>
              <CardHeader className="bg-white border-b py-3 px-5">
                <CardTitle className="text-xs font-bold">Table Columns</CardTitle>
                <CardDescription className="text-[10px]">Add, remove, rename, or toggle visibility of columns</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Column List */}
                <div className="space-y-2">
                  {state.tableColumns.map(col => (
                    <div key={col.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${col.visible ? "bg-white" : "bg-muted/30 opacity-60"}`}>
                      <button onClick={() => dispatch({ type: "UPDATE_COLUMN", payload: { id: col.id, updates: { visible: !col.visible } } })}>
                        {col.visible ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <Input
                        value={col.label}
                        onChange={e => dispatch({ type: "UPDATE_COLUMN", payload: { id: col.id, updates: { label: e.target.value } } })}
                        className="h-7 text-xs font-medium flex-1 border-none bg-transparent shadow-none focus-visible:ring-1"
                      />
                      <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold uppercase">{col.type}</span>
                      {col.id.startsWith("custom_") && (
                        <button onClick={() => dispatch({ type: "DELETE_COLUMN", payload: col.id })} className="text-destructive hover:scale-110 transition-transform">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {/* Add New Column */}
                <div className="flex gap-2">
                  <Input
                    placeholder="New column name..."
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddColumn()}
                    className="h-8 text-xs flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={handleAddColumn} className="h-8 text-xs gap-1 rounded-full">
                    <Plus className="w-3 h-3" /> Add Column
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="bg-primary/10" />

          {/* Default Terms */}
          <section className="space-y-3 pb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="w-4 h-4" />
                <h3 className="font-bold text-sm">Default Terms & Conditions</h3>
              </div>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border shadow-sm">
                <Label htmlFor="show-terms" className="text-[9px] font-bold uppercase tracking-tight">Show</Label>
                <Switch id="show-terms" checked={state.builderConfig.showTerms} onCheckedChange={(v) => handleToggleSection("showTerms", v)} className="scale-[0.65]" />
              </div>
            </div>
            <Card className={`border-none shadow-sm transition-all duration-300 ${!state.builderConfig.showTerms ? "opacity-40 grayscale" : "bg-white/50"}`}>
              <CardContent className="p-5">
                <TermsSection terms={state.terms} onUpdate={handleUpdateTerms} />
              </CardContent>
            </Card>
          </section>

        </div>
      </ScrollArea>
    </main>
  );
}
