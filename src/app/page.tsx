"use client";

import { useQuotationState } from "@/hooks/useQuotationState";
import { BrandingPanel } from "@/components/builder/BrandingPanel";
import { DocumentInfoForm } from "@/components/builder/DocumentInfoForm";
import { PersonnelSection } from "@/components/builder/PersonnelSection";
import { ItemsTable } from "@/components/builder/ItemsTable";
import { TermsSection } from "@/components/builder/TermsSection";
import { PreviewContainer } from "@/components/preview/PreviewContainer";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users, LayoutGrid, Sparkles, Loader2, ScrollText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { TableColumn } from "@/types/quotation.types";

export default function Home() {
  const { state, dispatch, subtotal } = useQuotationState();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [isGeneratingTerms, setIsGeneratingTerms] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Handlers
  const handleUpdateBranding = (updates: any) => dispatch({ type: "SET_BRANDING", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const handleAddColumn = (col: TableColumn) => {
    dispatch({ type: "ADD_COLUMN", payload: col });
  };

  const handleDeleteColumn = (id: string) => {
    dispatch({ type: "DELETE_COLUMN", payload: id });
  };

  const handleUpdateColumn = (id: string, updates: Partial<TableColumn>) => {
    dispatch({ type: "UPDATE_COLUMN", payload: { id, updates } });
  };

  const handleGenerateTerms = async () => {
    if (state.items.length === 0) return;
    setIsGeneratingTerms(true);
    try {
      const itemsList = state.items.map(i => i.itemName).join(", ");
      const response = await fetch("/api/ai/generate-terms", {
        method: "POST",
        body: JSON.stringify({ items: itemsList }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.terms) {
        dispatch({ type: "SET_TERMS", payload: data.terms });
      }
    } catch (error) {
      console.error("Terms generation failed:", error);
    } finally {
      setIsGeneratingTerms(false);
    }
  };

  // Build visible tabs based on builderConfig (toggles only in Settings page)
  const allTabs = [
    { id: "document", label: "Document", icon: FileText, visible: true },
    { id: "client", label: "Client", icon: Users, visible: state.builderConfig.showClientInfo },
    { id: "parts", label: "Parts", icon: LayoutGrid, visible: state.builderConfig.showTable },
    { id: "terms", label: "Terms", icon: ScrollText, visible: state.builderConfig.showTerms },
  ];
  const visibleTabs = allTabs.filter(t => t.visible);

  return (
    <main className="flex h-screen bg-background overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden p-3 border-b bg-white flex justify-between items-center z-20">
        <h1 className="font-bold text-base">QuoteCraft</h1>
        <div className="flex gap-1.5">
          <Button
            variant={activeTab === "builder" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("builder")}
            className="text-xs h-8"
          >
            Builder
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            className="text-xs h-8"
          >
            Preview
          </Button>
        </div>
      </div>

      {/* Builder Panel */}
      <div className={`${activeTab === "builder" ? "flex" : "hidden"} md:flex w-full md:w-[480px] border-r flex-col h-full bg-slate-50/50`}>
        <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10 hidden md:flex">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">RFQ Builder</h1>
              <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-widest">Marine Document Generator</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 md:px-5 py-5">
          <Tabs defaultValue="document" className="w-full">
            <TabsList className={`grid grid-cols-${visibleTabs.length} mb-5 h-11 bg-white/70 backdrop-blur border p-1 rounded-xl shadow-sm`}>
              {visibleTabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs gap-1.5"
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Document Tab */}
            <TabsContent value="document" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
              <DocumentInfoForm
                data={state.documentInfo}
                onUpdate={handleUpdateDocInfo}
                showMachineInfo={state.builderConfig.showMachineInfo}
              />
              {/* Intro Text - compact */}
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

            {/* Client Tab */}
            {state.builderConfig.showClientInfo && (
              <TabsContent value="client" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                <PersonnelSection
                  company={state.company}
                  client={state.client}
                  onUpdateCompany={handleUpdateCompany}
                  onUpdateClient={handleUpdateClient}
                  hideCompany={!state.builderConfig.showBusinessProfile}
                  title="Customer Details"
                />
              </TabsContent>
            )}

            {/* Parts Tab */}
            {state.builderConfig.showTable && (
              <TabsContent value="parts" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                <ItemsTable
                  items={state.items}
                  tableColumns={state.tableColumns}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onAdd={handleAddItem}
                  onAddColumn={handleAddColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onUpdateColumn={handleUpdateColumn}
                />
              </TabsContent>
            )}

            {/* Terms Tab */}
            {state.builderConfig.showTerms && (
              <TabsContent value="terms" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Commercial Terms</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-primary gap-1"
                    onClick={handleGenerateTerms}
                    disabled={isGeneratingTerms || state.items.length === 0}
                  >
                    {isGeneratingTerms ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Suggest
                  </Button>
                </div>
                <TermsSection terms={state.terms} onUpdate={handleUpdateTerms} />
              </TabsContent>
            )}
          </Tabs>
        </ScrollArea>

        {/* Download Button */}
        <div className="p-4 border-t bg-white shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
          <Button
            disabled={state.items.length === 0}
            onClick={() => generateProfessionalPDF(state)}
            className="w-full h-11 text-sm font-bold shadow-lg shadow-primary/20 gap-2 group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className={`${activeTab === "preview" ? "block" : "hidden"} md:block flex-1 bg-slate-100 p-4 md:p-10 overflow-y-auto`}>
        {isClient && <PreviewContainer data={state} />}
      </div>
    </main>
  );
}
