"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuotationState } from "@/hooks/useQuotationState";
import { StepNavigation, FlowStep } from "@/components/flow/StepNavigation";
import { Step1Upload } from "@/components/flow/Step1Upload";
import { Step2CheckItems } from "@/components/flow/Step2CheckItems";
import { Step3AddPrices } from "@/components/flow/Step3AddPrices";
import { StepCustomizeColumns } from "@/components/flow/StepCustomizeColumns";
import { Step4SendQuote } from "@/components/flow/Step4SendQuote";
import { CompanyProfileModal } from "@/components/flow/CompanyProfileModal";
import { Button } from "@/components/ui/button";
import { 
  Building2, RotateCcw, FilePlus, Check, Loader2, Anchor 
} from "lucide-react";
import { LineItem, TableColumn, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { calculateGrandTotal } from "@/utils/calculations";
import { useToast } from "@/components/ui/Toast";

export default function Home() {
  const { state, dispatch, isSaved, subtotal, isHydrated } = useQuotationState();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Undo history stack (Principle 7: Forgive mistakes, Undo available)
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

  const handleNewQuote = useCallback(() => {
    pushUndo(state.items);
    dispatch({ type: "NEW_QUOTATION" });
    setCurrentStep(1);
    toastSuccess("Started a new quote! Company details were kept.");
  }, [dispatch, state.items, pushUndo, toastSuccess]);

  // Grand total calculation for the top bar (Principle 5)
  const grandTotal = calculateGrandTotal(
    subtotal,
    state.discount,
    state.discountType,
    state.taxPercent,
    state.shippingCharge
  );
  const currencySymbol = CURRENCY_SYMBOLS[state.currency] || "₹";

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 selection:bg-primary/10 selection:text-primary">
      {/* ===== NATIVE APP TOOLBAR ===== */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-3 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Brand & Document Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <Anchor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 leading-none">
                QuoteCraft
              </h1>
              {isHydrated && state.documentInfo.number && (
                <span
                  suppressHydrationWarning
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60"
                >
                  {state.documentInfo.number}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block mt-0.5">
              Marine & Industrial Quotations
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Principle 7: Autosave status chip */}
          <div className="hidden min-[480px]:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 text-[11px] font-semibold text-slate-600 border border-slate-200/50">
            {isSaved ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700 font-bold">Saved</span>
              </>
            ) : (
              <>
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-700">Saving...</span>
              </>
            )}
          </div>

          {/* Principle 7: Undo button */}
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-95"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Principle 4: Company Profile setup (Set up once, never again) */}
          <button
            type="button"
            onClick={() => setShowCompanyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors border border-slate-200/60 active:scale-95"
            title="Company logo, bank details, and terms"
          >
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Company Profile</span>
          </button>

          {/* Principle 5: Live Grand Total pill in header */}
          {isHydrated && state.items.length > 0 && grandTotal > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs font-mono font-bold text-emerald-800 shadow-2xs">
              <span className="text-[10px] font-sans text-emerald-600">Total:</span>
              <span>{currencySymbol}{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
          )}

          {/* New Quote button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleNewQuote}
            className="h-8 px-2.5 rounded-xl font-bold text-xs gap-1 border-slate-200 text-slate-700 active:scale-95"
            title="Start fresh quotation"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Quote</span>
          </Button>
        </div>
      </header>

      {/* ===== PRINCIPLE 1: 4-STEP NATIVE NAVIGATION BAR ===== */}
      <StepNavigation
        currentStep={currentStep}
        onStepChange={(s) => setCurrentStep(s)}
        itemCount={state.items.length}
        hasItems={state.items.length > 0}
      />

      {/* ===== MAIN FLOW SCREENS ===== */}
      <div className="flex-1 pb-28">
        {/* STEP 1: Upload buyer's RFQ */}
        {currentStep === 1 && (
          <Step1Upload
            state={state}
            onUpdateDocInfo={(u) => dispatch({ type: "SET_DOCUMENT_INFO", payload: u })}
            onUpdateClient={(u) => dispatch({ type: "SET_CLIENT", payload: u })}
            onImportComplete={handleImportComplete}
            onSkipUpload={handleSkipUpload}
          />
        )}

        {/* STEP 2: Check items */}
        {currentStep === 2 && (
          <Step2CheckItems
            items={state.items}
            tableColumns={state.tableColumns}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onDuplicateItem={handleDuplicateItem}
            onReorderItem={handleReorderItem}
            onUpdateColumn={(id, updates) => dispatch({ type: "UPDATE_COLUMN", payload: { id, updates } })}
            onDeleteColumn={(id) => dispatch({ type: "DELETE_COLUMN", payload: id })}
            onAddColumn={(col) => dispatch({ type: "ADD_COLUMN", payload: col })}
            onSetColumns={(cols) => dispatch({ type: "SET_COLUMNS", payload: cols })}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {/* STEP 3: Add prices (Spreadsheet feel) */}
        {currentStep === 3 && (
          <Step3AddPrices
            items={state.items}
            tableColumns={state.tableColumns}
            currency={state.currency}
            discount={state.discount}
            discountType={state.discountType}
            taxPercent={state.taxPercent}
            shippingCharge={state.shippingCharge}
            onUpdateItem={handleUpdateItem}
            onBatchUpdatePrices={handleBatchUpdatePrices}
            onSetCurrency={(c) => dispatch({ type: "SET_CURRENCY", payload: c })}
            onSetDiscount={(amount, type) => dispatch({ type: "SET_DISCOUNT", payload: { amount, type } })}
            onSetTaxPercent={(tax) => dispatch({ type: "SET_TAX_PERCENT", payload: tax })}
            onSetShipping={(ship) => dispatch({ type: "SET_SHIPPING", payload: ship })}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {/* STEP 4: Choose what appears in quotation (Custom columns & layout) */}
        {currentStep === 4 && (
          <StepCustomizeColumns
            state={state}
            onUpdateColumn={(id, updates) => dispatch({ type: "UPDATE_COLUMN", payload: { id, updates } })}
            onSetColumns={(cols) => dispatch({ type: "SET_COLUMNS", payload: cols })}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {/* STEP 5: Preview & Finalize (WhatsApp + PDF) */}
        {currentStep === 5 && (
          <Step4SendQuote
            state={state}
            onUpdateClient={(u) => dispatch({ type: "SET_CLIENT", payload: u })}
            onUpdateDocInfo={(u) => dispatch({ type: "SET_DOCUMENT_INFO", payload: u })}
            onUpdateState={(u) => {
              if (u.pdfOrientation) dispatch({ type: "SET_PDF_ORIENTATION", payload: u.pdfOrientation });
              if (u.pdfLayoutMode) dispatch({ type: "SET_PDF_LAYOUT_MODE", payload: u.pdfLayoutMode });
              if (u.pdfShowSignatureBlock !== undefined) dispatch({ type: "SET_PDF_SHOW_SIGNATURE", payload: u.pdfShowSignatureBlock });
            }}
            onBack={() => setCurrentStep(4)}
            onNewQuote={handleNewQuote}
          />
        )}
      </div>

      {/* ===== COMPANY PROFILE MODAL (SET UP ONCE, NEVER AGAIN) ===== */}
      <CompanyProfileModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        state={state}
        onUpdateCompany={(c) => dispatch({ type: "SET_COMPANY", payload: c })}
        onUpdateBranding={(b) => dispatch({ type: "SET_BRANDING", payload: b })}
        onUpdateTerms={(t) => dispatch({ type: "SET_TERMS", payload: t })}
      />
    </main>
  );
}
