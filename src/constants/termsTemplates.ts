export interface TermsTemplate {
  id: string;
  label: string;
  emoji: string;
  text: string;
}

export const TERMS_TEMPLATES: TermsTemplate[] = [
  {
    id: "payment_tt",
    label: "Payment (T/T)",
    emoji: "💳",
    text: "Payment: 100% advance by Telegraphic Transfer (T/T) before dispatch.",
  },
  {
    id: "payment_lc",
    label: "Payment (L/C)",
    emoji: "🏦",
    text: "Payment: By irrevocable Letter of Credit (L/C) at sight.",
  },
  {
    id: "payment_credit",
    label: "30-Day Credit",
    emoji: "📅",
    text: "Payment: Net 30 days from the date of invoice.",
  },
  {
    id: "delivery_exw",
    label: "Delivery (EXW)",
    emoji: "📦",
    text: "Delivery: Ex-Works (EXW). Buyer arranges collection and freight.",
  },
  {
    id: "delivery_fob",
    label: "Delivery (FOB)",
    emoji: "🚢",
    text: "Delivery: FOB origin port. Estimated lead time: 3-5 weeks subject to stock availability.",
  },
  {
    id: "delivery_cif",
    label: "Delivery (CIF)",
    emoji: "🌍",
    text: "Delivery: CIF destination port. Freight and insurance included in quoted price.",
  },
  {
    id: "warranty",
    label: "Warranty",
    emoji: "🛡️",
    text: "Warranty: 12 months from date of delivery or 6 months from commissioning, whichever comes first.",
  },
  {
    id: "packing",
    label: "Packing",
    emoji: "📋",
    text: "Packing: Sea-worthy export packing with proper marking and labeling as per international standards.",
  },
  {
    id: "validity",
    label: "Quote Validity",
    emoji: "⏰",
    text: "This quotation is valid for 30 days from the date of issue. Prices are subject to change after validity period.",
  },
  {
    id: "origin",
    label: "Country of Origin",
    emoji: "🏭",
    text: "Country of Origin: As per manufacturer. Certificate of Origin available on request.",
  },
  {
    id: "condition",
    label: "Condition",
    emoji: "✅",
    text: "Condition: Brand new, OEM/Genuine parts with manufacturer's warranty.",
  },
  {
    id: "inspection",
    label: "Inspection",
    emoji: "🔍",
    text: "Inspection: Third-party inspection available at additional cost upon buyer's request.",
  },
];
