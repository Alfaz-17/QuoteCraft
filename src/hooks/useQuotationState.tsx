"use client";

import React, {
  createContext, useContext, useReducer, useEffect,
  useMemo, useState, useRef, useCallback,
} from "react";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay],
  );
}

export function QuotationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch]     = useReducer(quotationReducer, initialState);
  const [isHydrated, setIsHydrated]   = useState(false);
  const [isSaved, setIsSaved]         = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus]   = useState<SyncStatus>("local");

  const { data: session, status: sessionStatus } = useSession();

  const profileLoadedRef = useRef(false);

  // ── 1. Hydrate from localStorage (once) ───────────────────────────────────
  useEffect(() => {
    try {
      const saved        = localStorage.getItem(STORAGE_KEY);
      const savedCompany = localStorage.getItem(COMPANY_KEY);
      const savedBranding = localStorage.getItem(BRANDING_KEY);
      const savedTerms   = localStorage.getItem(TERMS_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (savedCompany)  parsed.company  = { ...parsed.company,  ...JSON.parse(savedCompany) };
        if (savedBranding) parsed.branding = { ...parsed.branding, ...JSON.parse(savedBranding) };
        if (savedTerms)    parsed.terms    = savedTerms;
        dispatch({ type: "RESET", payload: parsed });
      } else if (savedCompany || savedBranding || savedTerms) {
        const updates: Partial<QuotationState> = {};
        if (savedCompany)  updates.company  = JSON.parse(savedCompany);
        if (savedBranding) updates.branding = JSON.parse(savedBranding);
        if (savedTerms)    updates.terms    = savedTerms;
        dispatch({ type: "RESET", payload: { ...initialState, ...updates } as QuotationState });
      }
    } catch (e) {
      console.error("Failed to load saved state", e);
    }
    setIsHydrated(true);
  }, []);

  // ── 2. Load profile from DB on login (once per session) ───────────────────
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session || !isHydrated) return;
    if (profileLoadedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok || cancelled) return;
        const { profile } = await res.json();
        if (!profile || cancelled) return;

        dispatch({
          type: "RESET",
          payload: {
            ...state,
            company:      profile.company      ?? state.company,
            branding:     { ...(profile.branding ?? {}), logo: state.branding.logo },
            terms:        profile.terms         ?? state.terms,
            tableColumns: profile.tableColumns?.length ? profile.tableColumns : state.tableColumns,
            builderConfig: profile.builderConfig ?? state.builderConfig,
          } as QuotationState,
        });
        profileLoadedRef.current = true;
      } catch (e) {
        console.error("Failed to load user profile from DB", e);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, session, isHydrated]);

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
      try { localStorage.setItem(COMPANY_KEY, JSON.stringify(s.company)); } catch {}
      try {
        localStorage.setItem(BRANDING_KEY, JSON.stringify(s.branding));
      } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          localStorage.setItem(BRANDING_KEY, JSON.stringify({ ...s.branding, logo: null }));
        }
      }
      if (s.terms) { try { localStorage.setItem(TERMS_KEY, s.terms); } catch {} }
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
    if (sessionStatus !== "authenticated" || !session) { setSyncStatus("local"); return; }
    debouncedSyncQuotation(state);
  }, [state, isHydrated, sessionStatus, session]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (sessionStatus !== "authenticated" || !session) return;
    if (!profileChanged) return;

    debouncedSyncProfile(state);
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    state.company, state.branding, state.terms,
    state.tableColumns, state.builderConfig,
    isHydrated, sessionStatus, session,
  ]);

  const subtotal = useMemo(() => calculateSubtotal(state.items), [state.items]);

  return (
    <QuotationContext.Provider value={{ state, dispatch, subtotal, isSaved, lastSavedAt, syncStatus }}>
      {children}
    </QuotationContext.Provider>
  );
}

export const useQuotationState = () => {
  const ctx = useContext(QuotationContext);
  if (!ctx) throw new Error("useQuotationState must be used within a QuotationProvider");
  return ctx;
};
