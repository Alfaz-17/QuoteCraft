"use client";

import { useQuotationState } from "@/hooks/useQuotationState";
import { DocumentInfoForm } from "@/components/builder/DocumentInfoForm";
import { PersonnelSection } from "@/components/builder/PersonnelSection";
import { ItemsTable } from "@/components/builder/ItemsTable";
import { TermsSection } from "@/components/builder/TermsSection";
import { PreviewContainer } from "@/components/preview/PreviewContainer";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users, LayoutGrid, ScrollText, ArrowLeft, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { TableColumn } from "@/types/quotation.types";

export default function Home() {
  const { state, dispatch, subtotal } = useQuotationState();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");

  useEffect(() => { setIsClient(true); }, []);

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

  const handleAddColumn = (col: TableColumn) => {
    dispatch({ type: "ADD_COLUMN", payload: col });
  };

  const handleDeleteColumn = (id: string) => {
    dispatch({ type: "DELETE_COLUMN", payload: id });
  };

  const handleUpdateColumn = (id: string, updates: Partial<TableColumn>) => {
    dispatch({ type: "UPDATE_COLUMN", payload: { id, updates } });
  };

  // Build visible tabs based on builderConfig
  const allTabs = [
    { id: "document", label: "Document", icon: FileText, visible: true },
    { id: "client", label: "Client", icon: Users, visible: state.builderConfig.showClientInfo },
    { id: "parts", label: "Parts", icon: LayoutGrid, visible: state.builderConfig.showTable },
    { id: "terms", label: "Terms", icon: ScrollText, visible: state.builderConfig.showTerms },
  ];
  const visibleTabs = allTabs.filter(t => t.visible);

  return (
    <main className="flex h-screen bg-background overflow-hidden flex-col md:flex-row pb-16 md:pb-0">

      {/* ===== MOBILE: Builder View ===== */}
      {activeTab === "builder" && (
        <div className="flex flex-col h-full w-full md:hidden">
          {/* Mobile Builder Header */}
          <div className="p-3 border-b bg-white flex justify-between items-center z-20 shrink-0">
            <h1 className="font-bold text-base">RFQ Builder</h1>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                disabled={state.items.length === 0}
                onClick={() => generateProfessionalPDF(state)}
                className="h-8 w-8"
              >
                <Download className="w-4 h-4" />
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
                  <PersonnelSection company={state.company} client={state.client} onUpdateCompany={handleUpdateCompany} onUpdateClient={handleUpdateClient} hideCompany={!state.builderConfig.showBusinessProfile} title="Customer Details" />
                </TabsContent>
              )}

              {state.builderConfig.showTable && (
                <TabsContent value="parts" className="space-y-5 outline-none">
                  <ItemsTable items={state.items} tableColumns={state.tableColumns} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onAdd={handleAddItem} onAddColumn={handleAddColumn} onDeleteColumn={handleDeleteColumn} onUpdateColumn={handleUpdateColumn} />
                </TabsContent>
              )}

              {state.builderConfig.showTerms && (
                <TabsContent value="terms" className="space-y-5 outline-none">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Commercial Terms</p>
                  <TermsSection terms={state.terms} onUpdate={handleUpdateTerms} />
                </TabsContent>
              )}
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
              disabled={state.items.length === 0}
              onClick={() => generateProfessionalPDF(state)}
              className="h-8 w-8"
            >
              <Download className="w-4 h-4" />
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
                <PersonnelSection company={state.company} client={state.client} onUpdateCompany={handleUpdateCompany} onUpdateClient={handleUpdateClient} hideCompany={!state.builderConfig.showBusinessProfile} title="Customer Details" />
              </TabsContent>
            )}

            {state.builderConfig.showTable && (
              <TabsContent value="parts" className="space-y-5 outline-none">
                <ItemsTable items={state.items} tableColumns={state.tableColumns} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onAdd={handleAddItem} onAddColumn={handleAddColumn} onDeleteColumn={handleDeleteColumn} onUpdateColumn={handleUpdateColumn} />
              </TabsContent>
            )}

            {state.builderConfig.showTerms && (
              <TabsContent value="terms" className="space-y-5 outline-none">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Commercial Terms</p>
                <TermsSection terms={state.terms} onUpdate={handleUpdateTerms} />
              </TabsContent>
            )}
          </Tabs>
        </ScrollArea>

        {/* Desktop Download Button */}
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

      {/* ===== DESKTOP: Preview Panel ===== */}
      <div className="hidden md:block flex-1 bg-slate-100 overflow-hidden h-full">
        {isClient && <PreviewContainer data={state} />}
      </div>
    </main>
  );
}
