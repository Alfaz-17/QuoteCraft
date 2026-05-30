"use client";

import { useQuotationState } from "@/hooks/useQuotationState";
import { DocumentInfoForm } from "@/components/builder/DocumentInfoForm";
import { PersonnelSection } from "@/components/builder/PersonnelSection";
import { ItemsTable } from "@/components/builder/ItemsTable";
import { TermsSection } from "@/components/builder/TermsSection";
import { PreviewContainer } from "@/components/preview/PreviewContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Users, LayoutGrid, ScrollText, ArrowLeft, Eye, FilePlus, Check, Loader2, DollarSign, Calculator, Cloud, CloudOff, LogIn, LogOut, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState, useCallback } from "react";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { TableColumn, Currency, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { calculateSubtotal, calculateDiscountAmount, calculateGrandTotal } from "@/utils/calculations";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";


const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
  { value: "AED", label: "AED" },
  { value: "INR", label: "₹ INR" },
  { value: "SGD", label: "S$ SGD" },
  { value: "JPY", label: "¥ JPY" },
];

export default function Home() {
  const { state, dispatch, subtotal, isSaved, lastSavedAt, syncStatus } = useQuotationState();
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

    const currencySymbol = CURRENCY_SYMBOLS[state.currency] || "$";

  const renderSyncStatus = () => {
    switch (syncStatus) {
      case "syncing":
        return (
          <span className="flex items-center gap-1.5 text-[9.5px] font-bold text-amber-700 bg-amber-50/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-amber-200/50 shadow-sm animate-pulse shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0 text-amber-600" /> 
            Syncing Draft
          </span>
        );
      case "synced":
        return null;
      case "error":
        return (
          <span className="flex items-center gap-1.5 text-[9.5px] font-bold text-rose-700 bg-rose-50/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-rose-200/50 shadow-sm shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <CloudOff className="w-2.5 h-2.5 text-rose-600 shrink-0" /> 
            Draft Offline
          </span>
        );
      case "local":
      default:
        return (
          <Link href="/register" className="flex items-center gap-1.5 text-[9.5px] font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-indigo-200/50 shadow-sm transition-all shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
            <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" /> 
            Saved Locally
          </Link>
        );
    }
  };

  // Handlers
  const handleUpdateDocInfo = (updates: any) => dispatch({ type: "SET_DOCUMENT_INFO", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const handleUpdateCompany = (updates: any) => dispatch({ type: "SET_COMPANY", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const handleUpdateClient = (updates: any) => dispatch({ type: "SET_CLIENT", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const handleUpdateTerms = (terms: string) => dispatch({ type: "SET_TERMS", payload: terms });
  const handleUpdateIntroText = (text: string) => dispatch({ type: "SET_INTRO_TEXT", payload: text });

  const handleAddItem = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: Date.now().toString(),
        itemName: "",
        description: "",
        partNumber: "",
        quantity: 1,
        unit: "pcs",
        condition: "",
        unitPrice: 0,
      },
    });
  };

  const handleUpdateItem = (id: string, updates: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    dispatch({ type: "UPDATE_ITEM", payload: { id, updates } });
  };

  const handleDeleteItem = (id: string) => {
    dispatch({ type: "DELETE_ITEM", payload: id });
  };

  const handleDuplicateItem = (id: string) => {
    dispatch({ type: "DUPLICATE_ITEM", payload: id });
  };

  const handleReorderItem = (id: string, direction: "up" | "down") => {
    dispatch({ type: "REORDER_ITEM", payload: { id, direction } });
  };

  const handleAddColumn = (col: TableColumn) => {
    dispatch({ type: "ADD_COLUMN", payload: col });
  };

  const handleDeleteColumn = (id: string) => {
    dispatch({ type: "DELETE_COLUMN", payload: id });
  };

  const handleUpdateColumn = (id: string, updates: Partial<TableColumn>) => {
    dispatch({ type: "UPDATE_COLUMN", payload: { id, updates } });
  };

  const handleNewQuotation = () => {
    if (window.confirm("Start a new quotation? Your current draft will be replaced (company profile is kept).")) {
      dispatch({ type: "NEW_QUOTATION" });
    }
  };

  const handleDownloadPDF = useCallback(async () => {
    setIsDownloading(true);
    try {
      // Small delay to show loading state
      await new Promise(r => setTimeout(r, 100));
      await generateProfessionalPDF(state);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  }, [state]);

  // Grand total calculations
  const discountAmount = calculateDiscountAmount(subtotal, state.discount, state.discountType);
  const grandTotal = calculateGrandTotal(subtotal, state.discount, state.discountType, state.taxPercent, state.shippingCharge);

  // Build visible tabs based on builderConfig
  const allTabs = [
    { id: "document", label: "Document", icon: FileText, visible: true },
    { id: "client", label: "Client", icon: Users, visible: state.builderConfig.showClientInfo },
    { id: "parts", label: "Parts", icon: LayoutGrid, visible: state.builderConfig.showTable },
  ];
  const visibleTabs = allTabs.filter(t => t.visible);

  // Totals section component — reused in both mobile & desktop
  const TotalsSection = () => (
    <div className="space-y-3 p-4 rounded-xl border bg-white/90 backdrop-blur-sm shadow-sm hover:border-primary/10 transition-all duration-200">
      <div className="flex items-center justify-between border-b pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-700">Financial Summary</p>
        </div>
        <span className="text-[9px] font-black uppercase text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full">Estimates</span>
      </div>
      
      {/* Currency */}
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-bold uppercase tracking-tight w-20 shrink-0 text-slate-600">Currency</Label>
        <Select value={state.currency} onValueChange={(v) => dispatch({ type: "SET_CURRENCY", payload: v as Currency })}>
          <SelectTrigger className="h-8 text-xs flex-1 font-medium bg-slate-50/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Discount */}
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-bold uppercase tracking-tight w-20 shrink-0 text-slate-600">Discount</Label>
        <Input
          type="number"
          min={0}
          value={state.discount || ""}
          onChange={e => dispatch({ type: "SET_DISCOUNT", payload: { amount: parseFloat(e.target.value) || 0, type: state.discountType } })}
          className="h-8 text-xs text-right flex-1 bg-slate-50/50"
          placeholder="0"
        />
        <Select value={state.discountType} onValueChange={(v) => dispatch({ type: "SET_DISCOUNT", payload: { amount: state.discount, type: v as "flat" | "percent" } })}>
          <SelectTrigger className="h-8 text-xs w-20 bg-slate-50/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flat">{currencySymbol}</SelectItem>
            <SelectItem value="percent">%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tax */}
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-bold uppercase tracking-tight w-20 shrink-0 text-slate-600">Tax %</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={state.taxPercent || ""}
          onChange={e => dispatch({ type: "SET_TAX_PERCENT", payload: parseFloat(e.target.value) || 0 })}
          className="h-8 text-xs text-right flex-1 bg-slate-50/50"
          placeholder="0"
        />
        <span className="text-[11px] text-muted-foreground w-20 text-center font-bold">%</span>
      </div>

      {/* Shipping */}
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-bold uppercase tracking-tight w-20 shrink-0 text-slate-600">Shipping</Label>
        <Input
          type="number"
          min={0}
          value={state.shippingCharge || ""}
          onChange={e => dispatch({ type: "SET_SHIPPING", payload: parseFloat(e.target.value) || 0 })}
          className="h-8 text-xs text-right flex-1 bg-slate-50/50"
          placeholder="0"
        />
        <span className="text-[11px] text-muted-foreground w-20 text-center font-bold">{currencySymbol}</span>
      </div>

      {/* Structured Billing Calculations */}
      <div className="mt-4 pt-3.5 border-t border-slate-100/80 space-y-2 text-xs">
        <div className="flex justify-between text-slate-500 font-semibold">
          <span>Subtotal</span>
          <span className="font-mono">{currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        {state.discount > 0 && (
          <div className="flex justify-between text-rose-600 font-semibold bg-rose-50/50 px-2 py-0.5 rounded">
            <span>Discount ({state.discountType === "percent" ? `${state.discount}%` : "flat"})</span>
            <span className="font-mono">-{currencySymbol}{discountAmount.toFixed(2)}</span>
          </div>
        )}
        {state.taxPercent > 0 && (
          <div className="flex justify-between text-slate-500 font-semibold">
            <span>Tax ({state.taxPercent}%)</span>
            <span className="font-mono">{currencySymbol}{((subtotal - discountAmount) * state.taxPercent / 100).toFixed(2)}</span>
          </div>
        )}
        {state.shippingCharge > 0 && (
          <div className="flex justify-between text-slate-500 font-semibold">
            <span>Shipping & Handling</span>
            <span className="font-mono">{currencySymbol}{state.shippingCharge.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-800 font-black text-sm pt-2.5 border-t border-dashed border-slate-200">
          <span>Grand Total</span>
          <span className="font-mono text-primary text-base">{currencySymbol}{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex h-screen bg-background overflow-hidden flex-col md:flex-row pb-16 md:pb-0">

      {/* ===== MOBILE: Builder View ===== */}
      {activeTab === "builder" && (
        <div className="flex flex-col h-full w-full md:hidden">
          {/* Mobile Builder Header */}
          <div className="p-3 border-b bg-white flex justify-between items-center z-20 shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base">RFQ Builder</h1>
              {isClient && renderSyncStatus()}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewQuotation}
                className="h-8 w-8"
                title="New Quotation"
              >
                <FilePlus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={state.items.length === 0 || isDownloading}
                onClick={handleDownloadPDF}
                className="h-8 w-8"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab("preview")}
                className="text-xs h-8 gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </Button>
            </div>
          </div>

          {/* Mobile Builder Content */}
          <ScrollArea className="flex-1 px-4 py-5">
            <Tabs defaultValue="document" className="w-full">
              <TabsList className="grid mb-5 h-11 bg-white/70 backdrop-blur border p-1 rounded-xl shadow-sm" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
                {visibleTabs.map(tab => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[11px] gap-1"
                  >
                    <tab.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="document" className="space-y-5 outline-none">
                <DocumentInfoForm data={state.documentInfo} onUpdate={handleUpdateDocInfo} showMachineInfo={state.builderConfig.showMachineInfo} />
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Intro Text</p>
                  <textarea
                    className="w-full h-20 p-3 text-xs border rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none bg-white"
                    value={state.introText}
                    onChange={(e) => handleUpdateIntroText(e.target.value)}
                    placeholder="Introductory text for the RFQ..."
                  />
                </div>
              </TabsContent>

              {state.builderConfig.showClientInfo && (
                <TabsContent value="client" className="space-y-5 outline-none">
                  <PersonnelSection company={state.company} client={state.client} onUpdateCompany={handleUpdateCompany} onUpdateClient={handleUpdateClient} hideCompany={true} title="Customer Details" />
                </TabsContent>
              )}

              {state.builderConfig.showTable && (
                <TabsContent value="parts" className="space-y-5 outline-none">
                  <ItemsTable
                    items={state.items}
                    tableColumns={state.tableColumns}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    onAdd={handleAddItem}
                    onDuplicate={handleDuplicateItem}
                    onReorder={handleReorderItem}
                    onAddColumn={handleAddColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onUpdateColumn={handleUpdateColumn}
                    onImportItems={(items) => dispatch({ type: "SET_ITEMS", payload: items })}
                    currencySymbol={currencySymbol}
                  />
                  <TotalsSection />
                </TabsContent>
              )}

              {/* Terms tab content removed and moved inline under Document tab */}
            </Tabs>
          </ScrollArea>

        </div>
      )}

      {/* ===== MOBILE: Preview View ===== */}
      {activeTab === "preview" && (
        <div className="flex flex-col h-full w-full md:hidden">
          {/* Preview Header with Back + Download */}
          <div className="p-3 border-b bg-white flex justify-between items-center z-20 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("builder")}
              className="text-xs h-8 gap-1 -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Builder
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={state.items.length === 0 || isDownloading}
              onClick={handleDownloadPDF}
              className="h-8 w-8"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </div>

          {/* Mobile Preview Content */}
          <div className="flex-1 bg-white overflow-y-auto pb-20">
            {isClient && <PreviewContainer data={state} isMobile={true} />}
          </div>
        </div>
      )}

      {/* ===== DESKTOP: Builder Panel ===== */}
      <div className="hidden md:flex w-[480px] border-r flex-col h-full bg-slate-50/50">
        <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">RFQ Builder</h1>
              <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-widest">Marine Document Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isClient && renderSyncStatus()}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewQuotation}
              className="h-8 text-xs gap-1 rounded-full"
              title="New Quotation"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New
            </Button>
            {session ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="h-8 text-xs text-destructive rounded-full hover:bg-red-50"
                title={`Logged in as ${session.user?.name || session.user?.email}`}
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs font-bold rounded-full shadow-sm"
                asChild
              >
                <Link href="/login">
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-5 py-5">
          <Tabs defaultValue="document" className="w-full">
            <TabsList className="grid mb-5 h-11 bg-white/70 backdrop-blur border p-1 rounded-xl shadow-sm" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
              {visibleTabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[11px] gap-1"
                >
                  <tab.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="document" className="space-y-5 outline-none">
              <DocumentInfoForm data={state.documentInfo} onUpdate={handleUpdateDocInfo} showMachineInfo={state.builderConfig.showMachineInfo} />
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Intro Text</p>
                <textarea
                  className="w-full h-20 p-3 text-xs border rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none bg-white"
                  value={state.introText}
                  onChange={(e) => handleUpdateIntroText(e.target.value)}
                  placeholder="Introductory text for the RFQ..."
                />
              </div>
            </TabsContent>

            {state.builderConfig.showClientInfo && (
              <TabsContent value="client" className="space-y-5 outline-none">
                <PersonnelSection company={state.company} client={state.client} onUpdateCompany={handleUpdateCompany} onUpdateClient={handleUpdateClient} hideCompany={true} title="Customer Details" />
              </TabsContent>
            )}

            {state.builderConfig.showTable && (
              <TabsContent value="parts" className="space-y-5 outline-none">
                <ItemsTable
                  items={state.items}
                  tableColumns={state.tableColumns}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onAdd={handleAddItem}
                  onDuplicate={handleDuplicateItem}
                  onReorder={handleReorderItem}
                  onAddColumn={handleAddColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onUpdateColumn={handleUpdateColumn}
                  onImportItems={(items) => dispatch({ type: "SET_ITEMS", payload: items })}
                  currencySymbol={currencySymbol}
                />
                <TotalsSection />
              </TabsContent>
            )}

            {/* Terms tab content removed and moved inline under Document tab */}
          </Tabs>
        </ScrollArea>

        {/* Desktop Download Button */}
        <div className="p-4 border-t bg-white shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
          <Button
            disabled={state.items.length === 0 || isDownloading}
            onClick={handleDownloadPDF}
            className="w-full h-11 text-sm font-bold shadow-lg shadow-primary/20 gap-2 group"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ===== DESKTOP: Preview Panel ===== */}
      <div className="hidden md:block flex-1 bg-slate-100 overflow-hidden h-full">
        {isClient && <PreviewContainer data={state} />}
      </div>
    </main>
  );
}
