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

export interface QuotationBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  font: string;
  layout: "classic" | "minimal" | "technical" | "marine";
}

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
