"use client";

import { QuotationProvider } from "@/hooks/useQuotationState";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <QuotationProvider>{children}</QuotationProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
