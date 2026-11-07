"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useQuotationState } from "@/hooks/useQuotationState";
import { StepNavigation, FlowStep } from "@/components/flow/StepNavigation";
import { Step1Upload } from "@/components/flow/Step1Upload";
import { Step2CheckItems } from "@/components/flow/Step2CheckItems";
import { Step3AddPricesAndSend } from "@/components/flow/Step3AddPricesAndSend";
import { CompanyProfileModal } from "@/components/flow/CompanyProfileModal";
import { Button } from "@/components/ui/button";
import { 
  Building2, RotateCcw, FilePlus, Check, Loader2, LayoutDashboard 
} from "lucide-react";
import { LineItem, TableColumn, CURRENCY_SYMBOLS, QuotationState, Currency } from "@/types/quotation.types";
import { calculateGrandTotal } from "@/utils/calculations";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { LandingPage } from "@/components/landing/LandingPage";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { HeroSailingLoader, DualOrbitalSpinner } from "@/components/ui/Loaders";

export default function Home() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  // While auth is initializing, render clean branded loading screen
  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-4">
        <HeroSailingLoader statusMessage="Loading QuoteCraft workspace..." />
      </div>
    );
  }

  // If user is not logged in, render the official brand landing page
  if (!isSignedIn) {
    return <LandingPage />;
  }

  return <QuotationBuilder />;
}

function QuotationBuilder() {
  const { state, dispatch, isSaved, subtotal, isHydrated } = useQuotationState();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Undo history stack
  const undoStack = useRef<LineItem[][]>([]);

  useEffect(() => {
    // If draft already has items, start at Step 3 (Prices) or Step 2 (Check items)
    if (state.items.length > 0 && state.items.some(i => i.itemName || i.partNumber)) {
      const hasAnyPrice = state.items.some(i => (i.unitPrice && i.unitPrice > 0));
      const frame = requestAnimationFrame(() => {
        setCurrentStep(hasAnyPrice ? 3 : 2);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Push previous items state before updating
  const pushUndo = useCallback((itemsToSave: LineItem[]) => {
    undoStack.current = [
      itemsToSave.map(item => ({ ...item })),
      ...undoStack.current.slice(0, 20),
    ];
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) {
      toastInfo("Nothing to undo.");
      return;
    }
    const previous = undoStack.current[0];
    undoStack.current = undoStack.current.slice(1);
    dispatch({ type: "SET_ITEMS", payload: previous });
    toastSuccess("Action undone!");
  }, [dispatch, toastInfo, toastSuccess]);

  // Global Ctrl+Z handler for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  // Handlers for state updates
  const handleUpdateItem = useCallback((id: string, updates: Partial<LineItem>) => {
    pushUndo(state.items);
    dispatch({ type: "UPDATE_ITEM", payload: { id, updates } });
  }, [dispatch, state.items, pushUndo]);

  const handleBatchUpdatePrices = useCallback((updates: { id: string; price: number }[]) => {
    pushUndo(state.items);
    const updateMap = new Map(updates.map(u => [u.id, u.price]));
    const nextItems = state.items.map(item => {
      if (updateMap.has(item.id)) {
        return { ...item, unitPrice: updateMap.get(item.id)! };
      }
      return item;
    });
    dispatch({ type: "SET_ITEMS", payload: nextItems });
  }, [dispatch, state.items, pushUndo]);

  const handleDeleteItem = useCallback((id: string) => {
    pushUndo(state.items);
    dispatch({ type: "DELETE_ITEM", payload: id });
  }, [dispatch, state.items, pushUndo]);

  const handleAddItem = useCallback(() => {
    pushUndo(state.items);
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
  }, [dispatch, state.items, pushUndo]);

  const handleDuplicateItem = useCallback((id: string) => {
    pushUndo(state.items);
    dispatch({ type: "DUPLICATE_ITEM", payload: id });
  }, [dispatch, state.items, pushUndo]);

  const handleReorderItem = useCallback((id: string, direction: "up" | "down") => {
    pushUndo(state.items);
    dispatch({ type: "REORDER_ITEM", payload: { id, direction } });
  }, [dispatch, state.items, pushUndo]);

  const handleImportComplete = useCallback((items: LineItem[], columns: TableColumn[]) => {
    pushUndo(state.items);
    dispatch({ type: "IMPORT_RFQ", payload: { items, columns } });
    setCurrentStep(2);
  }, [dispatch, state.items, pushUndo]);

  const handleSkipUpload = useCallback(() => {
    if (state.items.length === 0) {
      handleAddItem();
    }
    setCurrentStep(2);
  }, [state.items.length, handleAddItem]);

  const handleClearExtraction = useCallback(() => {
    pushUndo(state.items);
    dispatch({
      type: "SET_ITEMS",
      payload: [
        {
          id: Date.now().toString(),
          itemName: "",
          description: "",
          partNumber: "",
          quantity: 1,
          unit: "pcs",
          condition: "",
          unitPrice: 0,
        },
      ],
    });
    setCurrentStep(1);
    toastSuccess("Cleared extracted items. You can now upload a new RFQ file or start fresh.");
  }, [dispatch, state.items, pushUndo, toastSuccess]);

  const handleNewQuote = useCallback(() => {
    pushUndo(state.items);
    dispatch({ type: "NEW_QUOTATION" });
    setCurrentStep(1);
    toastSuccess("Started a new quote! Company profile was preserved.");
  }, [dispatch, state.items, pushUndo, toastSuccess]);

  const handleUpdateDocInfo = useCallback((u: Partial<QuotationState["documentInfo"]>) => {
    dispatch({ type: "SET_DOCUMENT_INFO", payload: u });
  }, [dispatch]);

  const handleUpdateClient = useCallback((u: Partial<QuotationState["client"]>) => {
    dispatch({ type: "SET_CLIENT", payload: u });
  }, [dispatch]);

  const handleUpdateCompany = useCallback((c: Partial<QuotationState["company"]>) => {
    dispatch({ type: "SET_COMPANY", payload: c });
  }, [dispatch]);

  const handleUpdateBranding = useCallback((b: Partial<QuotationState["branding"]>) => {
    dispatch({ type: "SET_BRANDING", payload: b });
  }, [dispatch]);

  const handleUpdateTerms = useCallback((t: string) => {
    dispatch({ type: "SET_TERMS", payload: t });
  }, [dispatch]);

  const handleSetCurrency = useCallback((c: Currency) => {
    dispatch({ type: "SET_CURRENCY", payload: c });
  }, [dispatch]);

  const handleSetDiscount = useCallback((amount: number, type: "percent" | "flat") => {
    dispatch({ type: "SET_DISCOUNT", payload: { amount, type } });
  }, [dispatch]);

  const handleSetTaxPercent = useCallback((tax: number) => {
    dispatch({ type: "SET_TAX_PERCENT", payload: tax });
  }, [dispatch]);

  const handleSetShipping = useCallback((ship: number) => {
    dispatch({ type: "SET_SHIPPING", payload: ship });
  }, [dispatch]);

  // Grand total calculation for the top bar
  const grandTotal = calculateGrandTotal(
    subtotal,
    state.discount,
    state.discountType,
    state.taxPercent,
    state.shippingCharge
  );
  const currencySymbol = CURRENCY_SYMBOLS[state.currency] || "₹";

  return (
    <div className="h-[100dvh] flex flex-col bg-[#FAF9F5] overflow-hidden text-[#0F172A] selection:bg-teal-500/10 selection:text-teal-900">
      {/* ===== NATIVE APP TOOLBAR (z-30) ===== */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] flex items-center justify-between z-30 shadow-2xs app-chrome select-none">
        {/* Brand & Document Info */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 group min-h-[44px]" title="Return to Dashboard">
            <QuoteCraftLogo size={32} showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-[#0F172A] leading-none group-hover:text-[#0F766E] transition-colors">
                  Quote<span className="text-[#0F766E]">Craft</span>
                </h1>
                {isHydrated && state.documentInfo.number && (
                  <span
                    suppressHydrationWarning
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {state.documentInfo.number}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#475569] font-medium hidden sm:block mt-0.5">
                Marine &amp; Industrial Quotation Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Dashboard link for mobile */}
          <Link
            href="/dashboard"
            className="flex sm:hidden items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors min-h-[44px]"
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 text-[#0F766E]" />
            <span>Dashboard</span>
          </Link>
          {/* Autosave status chip */}
          <div className="hidden min-[480px]:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 min-h-[44px]">
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-800 font-bold">Saved</span>
              </>
            ) : (
              <>
                <DualOrbitalSpinner size="sm" />
                <span className="text-amber-800">Saving...</span>
              </>
            )}
          </div>

          {/* Undo button */}
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors active:scale-95 min-h-[44px]"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Company Profile button */}
          <button
            type="button"
            onClick={() => setShowCompanyModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200 active:scale-95 min-h-[44px]"
            title="Company logo, bank details, and terms"
          >
            <Building2 className="w-4 h-4 text-[#0F766E]" />
            <span className="hidden sm:inline">Company Profile</span>
          </button>

          {/* Live Grand Total pill in header */}
          {isHydrated && state.items.length > 0 && grandTotal > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800 shadow-2xs min-h-[44px]">
              <span className="text-xs font-sans text-emerald-700 font-semibold">Total:</span>
              <span>{currencySymbol}{grandTotal.toLocaleString(state.currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 0 })}</span>
            </div>
          )}

          {/* New Quote button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleNewQuote}
            className="min-h-[44px] px-3.5 rounded-lg font-bold text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95"
            title="Start fresh quotation"
          >
            <FilePlus className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">New Quote</span>
          </Button>
        </div>
      </header>

      {/* ===== 3-STEP NATIVE NAVIGATION BAR (z-20) ===== */}
      <div className="shrink-0 z-20">
        <StepNavigation
          currentStep={currentStep}
          onStepChange={(s) => setCurrentStep(s)}
          itemCount={state.items.length}
          hasItems={state.items.length > 0}
        />
      </div>

      {/* ===== MAIN 3-STEP FLOW (scrollable flex-1) ===== */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* STEP 1: Customer's request (RFQ) */}
        {currentStep === 1 && (
          <Step1Upload
            state={state}
            onUpdateDocInfo={handleUpdateDocInfo}
            onUpdateClient={handleUpdateClient}
            onImportComplete={handleImportComplete}
            onSkipUpload={handleSkipUpload}
          />
        )}

        {/* STEP 2: Items & Pricing */}
        {currentStep === 2 && (
          <Step2CheckItems
            state={state}
            items={state.items}
            tableColumns={state.tableColumns}
            onUpdateItem={handleUpdateItem}
            onBatchUpdatePrices={handleBatchUpdatePrices}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onDuplicateItem={handleDuplicateItem}
            onReorderItem={handleReorderItem}
            onSetCurrency={handleSetCurrency}
            onSetDiscount={handleSetDiscount}
            onSetTaxPercent={handleSetTaxPercent}
            onSetShipping={handleSetShipping}
            onUpdateClient={handleUpdateClient}
            onUpdateDocInfo={handleUpdateDocInfo}
            onUpdateColumn={(id, updates) => dispatch({ type: "UPDATE_COLUMN", payload: { id, updates } })}
            onDeleteColumn={(id) => dispatch({ type: "DELETE_COLUMN", payload: id })}
            onAddColumn={(col) => dispatch({ type: "ADD_COLUMN", payload: col })}
            onSetColumns={(cols) => dispatch({ type: "SET_COLUMNS", payload: cols })}
            onClearExtraction={handleClearExtraction}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {/* STEP 3: Add prices & send */}
        {currentStep === 3 && (
          <Step3AddPricesAndSend
            state={state}
            onUpdateItem={handleUpdateItem}
            onBatchUpdatePrices={handleBatchUpdatePrices}
            onSetCurrency={handleSetCurrency}
            onSetDiscount={handleSetDiscount}
            onSetTaxPercent={handleSetTaxPercent}
            onSetShipping={handleSetShipping}
            onUpdateClient={handleUpdateClient}
            onUpdateDocInfo={handleUpdateDocInfo}
            onUpdateState={(u) => {
              if (u.pdfOrientation) dispatch({ type: "SET_PDF_ORIENTATION", payload: u.pdfOrientation });
              if (u.pdfLayoutMode) dispatch({ type: "SET_PDF_LAYOUT_MODE", payload: u.pdfLayoutMode });
              if (u.pdfShowSignatureBlock !== undefined) dispatch({ type: "SET_PDF_SHOW_SIGNATURE", payload: u.pdfShowSignatureBlock });
            }}
            onBack={() => setCurrentStep(2)}
            onNewQuote={handleNewQuote}
          />
        )}
      </main>

      {/* ===== COMPANY PROFILE MODAL ===== */}
      <CompanyProfileModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        state={state}
        onUpdateCompany={handleUpdateCompany}
        onUpdateBranding={handleUpdateBranding}
        onUpdateTerms={handleUpdateTerms}
      />
    </div>
  );
}
