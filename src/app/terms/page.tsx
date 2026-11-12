import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = { title: "Terms of Service - QuoteCraft" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="12 November 2026"
      sections={[
        {
          heading: "1. The service",
          body: "QuoteCraft helps suppliers turn customer enquiries (RFQs) into priced quotations and PDF documents. By creating an account or using the service you agree to these terms.",
        },
        {
          heading: "2. Your account",
          body: "You are responsible for keeping your sign-in credentials secure and for all activity under your account. You must provide accurate company information on the quotations you issue.",
        },
        {
          heading: "3. Your content",
          body: "You keep ownership of the RFQs, price lists, logos and quotations you upload or create. You grant us permission to store and process that content only to provide the service to you.",
        },
        {
          heading: "4. AI extraction",
          body: "Some files are read using automated and AI-assisted extraction, which can make mistakes. Always review item names, quantities and prices before sending a quotation. You are responsible for the quotations you send to your customers.",
        },
        {
          heading: "5. Fair use and limits",
          body: "Usage limits (such as the daily number of AI extractions and maximum upload size) may apply and can change. Do not misuse the service, attempt to access other users' data, or upload unlawful content.",
        },
        {
          heading: "6. Availability",
          body: "The service is provided \"as is\" during its release-candidate period. We work to keep it available and your data safe, but we do not guarantee uninterrupted service and are not liable for indirect losses arising from its use.",
        },
        {
          heading: "7. Changes and termination",
          body: "We may update these terms or the service. You can stop using QuoteCraft at any time; we may suspend accounts that break these terms.",
        },
      ]}
    />
  );
}
