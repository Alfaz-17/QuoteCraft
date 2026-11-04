"use client";

import { QuotationProvider } from "@/hooks/useQuotationState";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#ffffff",
        },
      }}
    >
      <ToastProvider>
        <QuotationProvider>{children}</QuotationProvider>
      </ToastProvider>
    </ClerkProvider>
  );
}
