"use client";

import React, {
  createContext, useContext, useReducer, useEffect,
  useMemo, useState, useRef, useCallback,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { quotationReducer, initialState, QuotationAction } from "./quotationReducer";
import { QuotationState, Currency } from "../types/quotation.types";
import { calculateSubtotal } from "../utils/calculations";

export type SyncStatus = "local" | "syncing" | "synced" | "error";

interface QuotationContextType {
  state: QuotationState;
  dispatch: React.Dispatch<QuotationAction>;
  subtotal: number;
  isSaved: boolean;
  lastSavedAt: Date | null;
  syncStatus: SyncStatus;
  isHydrated: boolean;
}

const QuotationContext = createContext<QuotationContextType | null>(null);

const STORAGE_KEY  = "quoteDraft";
const COMPANY_KEY  = "companyProfile";
const BRANDING_KEY = "brandingProfile";
const TERMS_KEY    = "defaultTerms";

// ── Debounce helper ────────────────────────────────────────────────────────
function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number,
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback(
    (...args: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

export function QuotationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch]     = useReducer(quotationReducer, initialState);
  const [isHydrated, setIsHydrated]   = useState(false);
  const [isSaved, setIsSaved]         = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus]   = useState<SyncStatus>("local");

  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const profileLoadedRef = useRef(false);

  // ── 1. Hydrate from localStorage (once) ───────────────────────────────────
  useEffect(() => {
    try {
      const saved        = localStorage.getItem(STORAGE_KEY);
      const savedCompany = localStorage.getItem(COMPANY_KEY);
      const savedBranding = localStorage.getItem(BRANDING_KEY);
      const savedTerms   = localStorage.getItem(TERMS_KEY);
      const savedLogo    = localStorage.getItem("companyLogo");

      if (saved) {
        const parsed = JSON.parse(saved);
        if (savedCompany)  parsed.company  = { ...parsed.company,  ...JSON.parse(savedCompany) };
        if (savedBranding) parsed.branding = { ...parsed.branding, ...JSON.parse(savedBranding) };
        if (savedLogo)     parsed.branding = { ...parsed.branding, logo: savedLogo };
        if (savedTerms)    parsed.terms    = savedTerms;
        dispatch({ type: "RESET", payload: parsed });
      } else if (savedCompany || savedBranding || savedTerms || savedLogo) {
        const updates: Partial<QuotationState> = {};
        if (savedCompany)  updates.company  = JSON.parse(savedCompany);
        if (savedBranding) updates.branding = JSON.parse(savedBranding);
        if (savedLogo)     updates.branding = { ...(updates.branding || initialState.branding), logo: savedLogo };
        if (savedTerms)    updates.terms    = savedTerms;
        dispatch({ type: "RESET", payload: { ...initialState, ...updates } as QuotationState });
      }
    } catch (e) {
      console.error("Failed to load saved state", e);
    }
    setIsHydrated(true);
  }, []);

  // ── 2. Load profile from DB on login ─────────────────────────────────────
  useEffect(() => {
    if (!isSignedIn || !authLoaded || !isHydrated) return;
    // If profile was already loaded AND we have a valid company name, don't re-fetch
    if (profileLoadedRef.current && state.company?.name && state.company.name.trim().length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok || cancelled) return;
        const { profile } = await res.json();
        if (!profile || cancelled) return;

        const dbCompany = (profile.company && typeof profile.company === "object" && profile.company.name)
          ? { ...state.company, ...profile.company }
          : state.company;

        const currentLogo = state.branding.logo || (typeof window !== "undefined" ? localStorage.getItem("companyLogo") : null);

        const dbBranding = (profile.branding && typeof profile.branding === "object" && profile.branding.primaryColor)
          ? { ...state.branding, ...profile.branding, logo: currentLogo }
          : { ...state.branding, logo: currentLogo };

        const dbTerms = (typeof profile.terms === "string" && profile.terms.trim())
          ? profile.terms
          : state.terms;

        dispatch({
          type: "RESET",
          payload: {
            ...state,
            company:      dbCompany,
            branding:     dbBranding,
            terms:        dbTerms,
            currency:     (profile.builderConfig?.currency as Currency) || state.currency,
            tableColumns: profile.tableColumns?.length ? profile.tableColumns : state.tableColumns,
            builderConfig: profile.builderConfig ?? state.builderConfig,
          } as QuotationState,
        });

        // Also ensure companyProfile in localStorage is updated
        if (dbCompany.name) {
          try {
            localStorage.setItem(COMPANY_KEY, JSON.stringify(dbCompany));
          } catch {}
        }
        if (dbBranding.primaryColor) {
          try {
            localStorage.setItem(BRANDING_KEY, JSON.stringify(dbBranding));
          } catch {}
        }

        profileLoadedRef.current = true;
      } catch (e) {
        console.error("Failed to load user profile from DB", e);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, authLoaded, isHydrated, state.company.name]);

  // ── 3. Debounced localStorage save ────────────────────────────────────────
  const saveLocal = useCallback((s: QuotationState) => {
    try {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, branding: { ...s.branding, logo: null } }));
        } else throw e;
      }

      // CRITICAL: ONLY update permanent COMPANY_KEY if company has a valid name! Never overwrite with empty!
      if (s.company?.name && s.company.name.trim().length > 0) {
        try { localStorage.setItem(COMPANY_KEY, JSON.stringify(s.company)); } catch {}
      }

      // Update branding only if valid
      if (s.branding?.primaryColor) {
        try {
          localStorage.setItem(BRANDING_KEY, JSON.stringify(s.branding));
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
            localStorage.setItem(BRANDING_KEY, JSON.stringify({ ...s.branding, logo: null }));
          }
        }
      }

      if (s.branding?.logo) {
        try { localStorage.setItem("companyLogo", s.branding.logo); } catch {}
      }

      if (s.terms && s.terms.trim().length > 0) {
        try { localStorage.setItem(TERMS_KEY, s.terms); } catch {}
      }

      setIsSaved(true);
      setLastSavedAt(new Date());
    } catch (e) {
      console.error("Failed to save state locally", e);
    }
  }, []);

  const debouncedSaveLocal = useDebouncedCallback(saveLocal, 600);

  useEffect(() => {
    if (!isHydrated) return;
    setIsSaved(false);
    debouncedSaveLocal(state);
  }, [state, isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 4. Debounced cloud sync — quotation document ───────────────────────────
  const syncQuotation = useCallback(async (s: QuotationState) => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/quotation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      setSyncStatus(res.ok ? "synced" : "error");
    } catch {
      setSyncStatus("error");
    }
  }, []);

  const debouncedSyncQuotation = useDebouncedCallback(syncQuotation, 2000);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isSignedIn) { setSyncStatus("local"); return; }
    debouncedSyncQuotation(state);
  }, [state, isHydrated, isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 5. Debounced cloud sync — settings/profile only ───────────────────────
  // Stable identity derived values so the effect only fires when SETTINGS change,
  // not when items / documentInfo / client etc. change.
  const companyRef     = useRef(state.company);
  const brandingRef    = useRef(state.branding);
  const termsRef       = useRef(state.terms);
  const tableColsRef   = useRef(state.tableColumns);
  const builderCfgRef  = useRef(state.builderConfig);

  const profileChanged =
    state.company      !== companyRef.current    ||
    state.branding     !== brandingRef.current   ||
    state.terms        !== termsRef.current      ||
    state.tableColumns !== tableColsRef.current  ||
    state.builderConfig !== builderCfgRef.current;

  const syncProfile = useCallback(async (s: QuotationState) => {
    try {
      await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company:      s.company,
          branding:     s.branding,
          terms:        s.terms,
          tableColumns: s.tableColumns,
          builderConfig: s.builderConfig,
        }),
      });
    } catch (e) {
      console.error("Profile sync error:", e);
    }
  }, []);

  const debouncedSyncProfile = useDebouncedCallback(syncProfile, 3000);

  useEffect(() => {
    companyRef.current    = state.company;
    brandingRef.current   = state.branding;
    termsRef.current      = state.terms;
    tableColsRef.current  = state.tableColumns;
    builderCfgRef.current = state.builderConfig;

    if (!isHydrated || !profileLoadedRef.current) return;
    if (!isSignedIn) return;
    if (!profileChanged) return;

    debouncedSyncProfile(state);
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    state.company, state.branding, state.terms,
    state.tableColumns, state.builderConfig,
    isHydrated, isSignedIn,
  ]);

  const subtotal = useMemo(() => calculateSubtotal(state.items, state.tableColumns), [state.items, state.tableColumns]);

  return (
    <QuotationContext.Provider value={{ state, dispatch, subtotal, isSaved, lastSavedAt, syncStatus, isHydrated }}>
      {children}
    </QuotationContext.Provider>
  );
}

export const useQuotationState = () => {
  const ctx = useContext(QuotationContext);
  if (!ctx) throw new Error("useQuotationState must be used within a QuotationProvider");
  return ctx;
};
