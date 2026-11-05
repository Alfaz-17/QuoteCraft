"use client";

import { QuotationProvider } from "@/hooks/useQuotationState";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast";

const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_dmlhYmxlLXRlcnJpZXItNjMuY2xlcmsuYWNjb3VudHMuZGV2JA";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "#0F766E",
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
