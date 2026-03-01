import { useReducer, useEffect, useMemo } from "react";
import { quotationReducer, initialState } from "./quotationReducer";
import { calculateSubtotal } from "../utils/calculations";

export const useQuotationState = () => {
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

  return {
    state,
    dispatch,
    subtotal,
  };
};
