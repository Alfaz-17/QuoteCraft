export interface LineItem {
  id: string;
  itemName: string;
  description?: string;
  partNumber?: string;
  quantity: number;
  unit: string;
  itemType?: string;
  unitPrice: number;
  [key: string]: string | number | undefined; // Allow dynamic fields
}

export interface QuotationBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
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
}

export interface ClientInfo {
  name: string;
  companyName?: string;
  address: string;
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
  visible: boolean;
  width?: string;
}

export interface QuotationState {
  branding: QuotationBranding;
  documentInfo: DocumentInfo;
  introText?: string;
  company: CompanyInfo;
  client: ClientInfo;
  items: LineItem[];
  tableColumns: TableColumn[];
  terms: string;
  showChecklist?: boolean;
  showMachineInfo?: boolean;
  showCustomerDetails?: boolean;
  builderConfig: {
    showBusinessProfile: boolean;
    showClientInfo: boolean;
    showTerms: boolean;
    showTable: boolean;
    showMachineInfo: boolean;
  };
}
