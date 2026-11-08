"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuotationState } from "@/hooks/useQuotationState";
import { StepNavigation, FlowStep } from "@/components/flow/StepNavigation";
import { Step1Upload } from "@/components/flow/Step1Upload";
import { Step2CheckItems } from "@/components/flow/Step2CheckItems";
import { Step3AddPricesAndSend } from "@/components/flow/Step3AddPricesAndSend";
import { CompanyProfileModal } from "@/components/flow/CompanyProfileModal";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, FilePlus, ArrowLeft, MoreVertical, Building2, RefreshCw, LayoutDashboard
} from "lucide-react";
import { LineItem, TableColumn, QuotationState, Currency } from "@/types/quotation.types";

import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@clerk/nextjs";
import { LandingPage } from "@/components/landing/LandingPage";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { HeroSailingLoader } from "@/components/ui/Loaders";

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
  const router = useRouter();
  const { state, dispatch, isHydrated } = useQuotationState();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Undo history stack
  const undoStack = useRef<LineItem[][]>([]);

  // Check if authenticated user has completed company onboarding
  useEffect(() => {
    if (!isHydrated) return;
    if (!state.company.name) {
      (async () => {
        try {
          const res = await fetch("/api/user/profile");
          if (res.ok) {
            const data = await res.json();
            if (!data?.profile?.company?.name) {
              router.replace("/onboarding");
            }
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [isHydrated, state.company.name, router]);

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
      payload: [],
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











  return (
    <div className="h-[100dvh] flex flex-col bg-[#FAF9F5] overflow-hidden text-[#0F172A] selection:bg-teal-500/10 selection:text-teal-900">
      {/* ===== COMPACT NATIVE HEADER (56px, z-30) ===== */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-3.5 sm:px-6 py-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] flex items-center justify-between z-30 select-none">
        {/* Left: Back button & Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard"
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 group" title="QuoteCraft Dashboard">
            <QuoteCraftLogo size={26} showText={false} />
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#172033] leading-none group-hover:text-[#347A72] transition-colors truncate">
              Quote<span className="text-[#347A72]">Craft</span>
            </span>
            {state.documentInfo?.number && (
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                {state.documentInfo.number}
              </span>
            )}
          </Link>
        </div>

        {/* Right: Quick Undo + More Actions (⋮) Menu */}
        <div className="relative flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="More actions"
            aria-label="More actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* More Actions Dropdown Menu */}
          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl py-2 text-xs font-semibold animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleNewQuote();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <FilePlus className="w-4 h-4 text-[#347A72]" />
                  <span>Start New Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowCompanyModal(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-[#347A72]" />
                  <span>Company Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleClearExtraction();
                  }}
                  className="w-full px-4 py-2.5 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                  <span>Reset Extracted Items</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/dashboard"
                  onClick={() => setShowMoreMenu(false)}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Exit to Dashboard</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

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
