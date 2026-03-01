"use client";

import React, { createContext, useContext, useReducer, useEffect, useMemo } from "react";
import { quotationReducer, initialState, QuotationAction } from "./quotationReducer";
import { QuotationState } from "../types/quotation.types";
import { calculateSubtotal } from "../utils/calculations";

interface QuotationContextType {
  state: QuotationState;
  dispatch: React.Dispatch<QuotationAction>;
  subtotal: number;
}

const QuotationContext = createContext<QuotationContextType | null>(null);

export function QuotationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quotationReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("quoteDraft");
    if (saved) {
      try {
        dispatch({ type: "RESET", payload: JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse saved quote", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("quoteDraft", JSON.stringify(state));
  }, [state]);

  const subtotal = useMemo(() => calculateSubtotal(state.items), [state.items]);

  return (
    <QuotationContext.Provider value={{ state, dispatch, subtotal }}>
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
