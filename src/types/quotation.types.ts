export interface LineItem {
  id: string;
  sno?: number;
  itemName: string;
  description?: string;
  technicalSpecification?: string;
  partNumber?: string;
  quantity: number;
  unit: string;
  condition?: string;
  unitPrice: number;
  total?: number;
  needsReview?: boolean;
  isMissingQty?: boolean;
  [key: string]: string | number | boolean | undefined; // Allow dynamic fields
}

export type TemplateLayoutId = "marine" | "minimal" | "classic" | "technical";

export interface QuotationBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  font: string;
  layout: TemplateLayoutId;
}

export interface ColorPalettePreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export const PRESET_COLOR_PALETTES: ColorPalettePreset[] = [
  { id: "quotecraft-teal-gold", name: "Teal & Gold (Brand)", primaryColor: "#0F766E", secondaryColor: "#F59E0B", description: "Official QuoteCraft brand: Deep Teal & Gold with warm maritime prestige" },
  { id: "marine-navy", name: "Marine Navy", primaryColor: "#1E3A8A", secondaryColor: "#0284C7", description: "Trusted deep maritime navy & ocean cyan" },
  { id: "ocean-azure", name: "Ocean Azure", primaryColor: "#0284C7", secondaryColor: "#38BDF8", description: "Vibrant coastal blue & bright skies" },
  { id: "slate-steel", name: "Slate & Steel", primaryColor: "#334155", secondaryColor: "#64748B", description: "High-contrast industrial charcoal" },
  { id: "emerald-maritime", name: "Forest Emerald", primaryColor: "#065F46", secondaryColor: "#059669", description: "Eco-maritime green & clean teal" },
  { id: "crimson-nautical", name: "Crimson Port", primaryColor: "#881337", secondaryColor: "#E11D48", description: "Strong maritime red & warning accent" },
  { id: "deep-midnight", name: "Deep Midnight", primaryColor: "#0F172A", secondaryColor: "#3B82F6", description: "Modern executive dark slate & blue" },
];

export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  category: "sans" | "serif" | "mono";
  description: string;
  pdfFont: "helvetica" | "times" | "courier";
}

export const PRESET_FONTS: FontOption[] = [
  { id: "manrope", name: "Manrope (Brand)", fontFamily: "'Manrope', system-ui, -apple-system, sans-serif", category: "sans", description: "Official QuoteCraft typography — modern, geometric & ultra-legible", pdfFont: "helvetica" },
  { id: "inter", name: "Inter", fontFamily: "Inter, system-ui, -apple-system, sans-serif", category: "sans", description: "Crisp, clean & modern SaaS standard", pdfFont: "helvetica" },
  { id: "roboto", name: "Roboto", fontFamily: "Roboto, system-ui, sans-serif", category: "sans", description: "Technical, legible & engineering grade", pdfFont: "helvetica" },
  { id: "merriweather", name: "Merriweather", fontFamily: "Georgia, 'Times New Roman', serif", category: "serif", description: "Prestigious, classic & formal commercial", pdfFont: "times" },
  { id: "mono", name: "JetBrains / Courier", fontFamily: "ui-monospace, 'Courier New', monospace", category: "mono", description: "Industrial chandlery & part-code ledger", pdfFont: "courier" },
];

export interface TemplateDefinition {
  id: TemplateLayoutId;
  name: string;
  tagline: string;
  source: string;
  description: string;
}

export const QUOTATION_TEMPLATES: TemplateDefinition[] = [
  {
    id: "marine",
    name: "Marine Professional",
    tagline: "Corporate Maritime Standard",
    source: "QuoteCraft Standard",
    description: "Header logo on left, vessel/machinery badge, 5-column item grid with technical specs sub-text, and formal signature seal.",
  },
  {
    id: "minimal",
    name: "Modern Minimal",
    tagline: "Borderless Contemporary",
    source: "Inspired by Anvil Invoice",
    description: "Sleek Anvil-style minimalist table without heavy outer borders, light divider lines, generous whitespace, and right-aligned card summary.",
  },
  {
    id: "classic",
    name: "Classic Centered Banner",
    tagline: "Example 1 Iconic Layout",
    source: "From example1.zip",
    description: "Centered logo, bordered uppercase quotation header bar, clean side-by-side metadata tags, striped alternating rows, and bottom notice box.",
  },
  {
    id: "technical",
    name: "Technical Chandlery",
    tagline: "High-Density Equipment Ledger",
    source: "Industrial Spec",
    description: "Engineered for 50+ item vessel requisition orders with part/IMPA numbers, maker, drawing refs, tight padding, and compact totals.",
  },
];

export interface DocumentInfo {
  type: "quotation" | "rfq" | "proforma";
  number: string;
  date: string;
  validUntil: string;
  reference?: string;
  project?: string;
  vessel?: string;
  scope?: string;
  make?: string;
  model?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  bankDetails?: string;
}

export interface ClientInfo {
  name: string;
  companyName?: string;
  address: string;
  phone?: string;
  email?: string;
  country?: string;
  attn?: string;
}

// Dynamic table column definition
export interface TableColumn {
  id: string;
  label: string;
  key: string; // maps to LineItem field
  type: "text" | "number" | "auto"; // auto = computed like Total
  /** Which column drives the maths. Exactly one "qty", one "price" and one "total" per table. */
  role?: "qty" | "price" | "total";
  visible: boolean;
  width?: string;
  pdfVisible?: boolean; // Controls whether this column appears as its own column on the PDF
  pdfSecondary?: boolean; // If true, shown as technical detail beneath item description
}

export type Currency = "USD" | "EUR" | "GBP" | "AED" | "INR" | "SGD" | "JPY";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  INR: "₹",
  SGD: "S$",
  JPY: "¥",
};

export interface QuotationState {
  branding: QuotationBranding;
  documentInfo: DocumentInfo;
  introText?: string;
  company: CompanyInfo;
  client: ClientInfo;
  items: LineItem[];
  tableColumns: TableColumn[];
  terms: string;
  currency: Currency;
  discount: number; // flat amount
  discountType: "flat" | "percent";
  taxPercent: number;
  shippingCharge: number;
  showChecklist?: boolean;
  showMachineInfo?: boolean;
  showCustomerDetails?: boolean;
  pdfOrientation?: "portrait" | "landscape";
  pdfLayoutMode?: "clean" | "detailed";
  pdfShowSignatureBlock?: boolean;
  builderConfig: {
    showBusinessProfile: boolean;
    showClientInfo: boolean;
    showTerms: boolean;
    showTable: boolean;
    showMachineInfo: boolean;
  };
}
