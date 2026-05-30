"use client";

import React, { createContext, useContext, useReducer, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { quotationReducer, initialState, QuotationAction } from "./quotationReducer";
import { QuotationState } from "../types/quotation.types";
import { calculateSubtotal } from "../utils/calculations";

export type SyncStatus = "local" | "syncing" | "synced" | "error";

interface QuotationContextType {
  state: QuotationState;
  dispatch: React.Dispatch<QuotationAction>;
  subtotal: number;
  isSaved: boolean;
  lastSavedAt: Date | null;
  syncStatus: SyncStatus;
}

const QuotationContext = createContext<QuotationContextType | null>(null);

const STORAGE_KEY = "quoteDraft";
const COMPANY_KEY = "companyProfile";
const BRANDING_KEY = "brandingProfile";
const TERMS_KEY = "defaultTerms";

export function QuotationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quotationReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  
  const { data: session, status: sessionStatus } = useSession();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cloudSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount — BEFORE any saves happen
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedCompany = localStorage.getItem(COMPANY_KEY);
      const savedBranding = localStorage.getItem(BRANDING_KEY);
      const savedTerms = localStorage.getItem(TERMS_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge in persisted company/branding/terms if they exist separately
        if (savedCompany) {
          parsed.company = { ...parsed.company, ...JSON.parse(savedCompany) };
        }
        if (savedBranding) {
          parsed.branding = { ...parsed.branding, ...JSON.parse(savedBranding) };
        }
        if (savedTerms) {
          parsed.terms = savedTerms;
        }
        dispatch({ type: "RESET", payload: parsed });
      } else {
        // No saved quote — but maybe company/branding/terms were saved from settings
        if (savedCompany || savedBranding || savedTerms) {
          const updates: Partial<QuotationState> = {};
          if (savedCompany) updates.company = JSON.parse(savedCompany);
          if (savedBranding) updates.branding = JSON.parse(savedBranding);
          if (savedTerms) updates.terms = savedTerms;
          dispatch({ type: "RESET", payload: { ...initialState, ...updates } as QuotationState });
        }
      }
    } catch (e) {
      console.error("Failed to load saved state", e);
    }
    // Mark hydration complete — now saves are allowed
    setIsHydrated(true);
  }, []);

  // 1. Debounced save to localStorage — ONLY after hydration
  useEffect(() => {
    if (!isHydrated) return; // Don't save until we've loaded

    setIsSaved(false);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        // 1. Try to save full draft. Fallback to saving without logo if quota is exceeded.
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
            console.warn("Storage quota exceeded for draft. Saving without logo...");
            const stateWithoutLogo = { ...state, branding: { ...state.branding, logo: null } };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithoutLogo));
          } else {
            throw e;
          }
        }

        // 2. Try to save company profile separately
        try {
          localStorage.setItem(COMPANY_KEY, JSON.stringify(state.company));
        } catch (e) {
          console.error("Failed to save company profile locally", e);
        }

        // 3. Try to save branding separately. Fallback to saving without logo if quota is exceeded.
        try {
          localStorage.setItem(BRANDING_KEY, JSON.stringify(state.branding));
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
            console.warn("Storage quota exceeded for branding. Saving without logo...");
            const brandingWithoutLogo = { ...state.branding, logo: null };
            localStorage.setItem(BRANDING_KEY, JSON.stringify(brandingWithoutLogo));
          } else {
            console.error("Failed to save branding profile locally", e);
          }
        }

        // 4. Try to save default terms
        if (state.terms) {
          try {
            localStorage.setItem(TERMS_KEY, state.terms);
          } catch (e) {
            console.error("Failed to save default terms locally", e);
          }
        }

        setIsSaved(true);
        setLastSavedAt(new Date());
      } catch (e) {
        console.error("Failed to save state locally", e);
      }
    }, 500); // 500ms local debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isHydrated]);

  // 2. Debounced save to PostgreSQL Cloud — ONLY if logged in
  useEffect(() => {
    if (!isHydrated) return;

    if (sessionStatus !== "authenticated" || !session) {
      setSyncStatus("local");
      return;
    }

    setSyncStatus("syncing");

    if (cloudSyncTimeoutRef.current) {
      clearTimeout(cloudSyncTimeoutRef.current);
    }

    cloudSyncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/quotation/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        });

        if (!res.ok) {
          throw new Error("Cloud save failed");
        }

        setSyncStatus("synced");
      } catch (error) {
        console.error("Cloud autosave error:", error);
        setSyncStatus("error");
      }
    }, 1500); // 1.5s debounce for cloud database to prevent performance lags

    return () => {
      if (cloudSyncTimeoutRef.current) {
        clearTimeout(cloudSyncTimeoutRef.current);
      }
    };
  }, [state, isHydrated, sessionStatus, session]);

  const subtotal = useMemo(() => calculateSubtotal(state.items), [state.items]);

  return (
    <QuotationContext.Provider value={{ state, dispatch, subtotal, isSaved, lastSavedAt, syncStatus }}>
      {children}
    </QuotationContext.Provider>
  );
}

export const useQuotationState = () => {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error("useQuotationState must be used within a QuotationProvider");
  }
  return context;
};
