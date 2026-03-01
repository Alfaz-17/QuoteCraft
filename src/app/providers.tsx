"use client";

import { QuotationProvider } from "@/hooks/useQuotationState";

export function Providers({ children }: { children: React.ReactNode }) {
  return <QuotationProvider>{children}</QuotationProvider>;
}
