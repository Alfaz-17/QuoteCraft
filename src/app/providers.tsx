"use client";

import React from "react";
import { QuotationProvider } from "@/hooks/useQuotationState";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={{
        unstable__errors: {
          form_identifier_not_found:
            "We couldn't find an account with that email. Check the spelling, or create an account if you're new to QuoteCraft.",
          form_identifier_exists:
            "This email may already be linked to an account. Try signing in or resetting your password.",
          form_identifier_exists__email_address:
            "This email may already be linked to an account. Try signing in or resetting your password.",
          form_password_or_identifier_incorrect:
            "Those sign-in details don't match. Check your email and password, or create an account if you're new.",
          form_password_incorrect:
            "That password doesn't match this account. Try again or use the password reset option.",
        },
      }}
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
