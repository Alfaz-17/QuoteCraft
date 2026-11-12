import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = { title: "Privacy Policy - QuoteCraft" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="12 November 2026"
      sections={[
        {
          heading: "What we collect",
          body: "Account details (name, email) provided through our sign-in provider, your company profile and branding, and the RFQs, items, prices and quotations you create in QuoteCraft.",
        },
        {
          heading: "How we use it",
          body: "Only to run the service: extracting items from your RFQs, saving and generating your quotations, and supporting your account. We do not sell your data.",
        },
        {
          heading: "Service providers",
          body: "We use trusted providers to operate QuoteCraft, including authentication (Clerk), database hosting, application hosting, and AI processing for scanned documents. They process data only on our behalf.",
        },
        {
          heading: "Your browser",
          body: "Drafts and preferences are cached in your browser so you don't lose work. This cache is cleared when a different user signs in on the same browser.",
        },
        {
          heading: "Retention and deletion",
          body: "Your quotations are kept while your account is active. You can delete quotations at any time, and you can ask us to delete your account and its data.",
        },
        {
          heading: "Contact",
          body: "For privacy questions or deletion requests, contact the QuoteCraft team.",
        },
      ]}
    />
  );
}
