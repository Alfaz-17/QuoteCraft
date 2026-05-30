import { QuotationState, TableColumn, Currency } from "../types/quotation.types";

export const DEFAULT_COLUMNS: TableColumn[] = [
  { id: "sno", label: "S.No", key: "sno", type: "auto", visible: true, width: "50px" },
  { id: "name", label: "Item Name", key: "itemName", type: "text", visible: true },
  { id: "partNumber", label: "Part No.", key: "partNumber", type: "text", visible: true, width: "110px" },
  { id: "qty", label: "Qty", key: "quantity", type: "number", visible: true, width: "70px" },
  { id: "unit", label: "Unit", key: "unit", type: "text", visible: true, width: "70px" },
  { id: "condition", label: "Condition", key: "condition", type: "text", visible: true, width: "100px" },
  { id: "rate", label: "Rate", key: "unitPrice", type: "number", visible: true, width: "90px" },
  { id: "total", label: "Total", key: "total", type: "auto", visible: true, width: "90px" },
];

export const EMPTY_COMPANY: QuotationState["company"] = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
};

export const EMPTY_CLIENT: QuotationState["client"] = {
  name: "",
  companyName: "",
  address: "",
  attn: "",
};

// Generate next doc number from localStorage counter
function getNextDocNumber(): string {
  if (typeof window === "undefined") return "QT-1001";
  const lastNum = parseInt(localStorage.getItem("lastDocNumber") || "1000", 10);
  const next = lastNum + 1;
  localStorage.setItem("lastDocNumber", next.toString());
  return `QT-${next}`;
}

export function createFreshQuotation(company?: QuotationState["company"], branding?: QuotationState["branding"]): QuotationState {
  return {
    branding: branding || {
      logo: null,
      primaryColor: "#2563eb",
      secondaryColor: "#64748b",
      textColor: "#1e293b",
      font: "Inter",
      layout: "marine",
    },
    documentInfo: {
      type: "quotation",
      number: getNextDocNumber(),
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      vessel: "",
      scope: "",
      make: "",
      model: "",
      reference: "",
    },
    introText: "",
    company: company || { ...EMPTY_COMPANY },
    client: { ...EMPTY_CLIENT },
    items: [
      {
        id: "1",
        itemName: "",
        description: "",
        partNumber: "",
        quantity: 1,
        unit: "pcs",
        condition: "",
        unitPrice: 0,
      },
    ],
    tableColumns: [...DEFAULT_COLUMNS],
    terms: "",
    currency: "USD" as Currency,
    discount: 0,
    discountType: "flat",
    taxPercent: 0,
    shippingCharge: 0,
    showChecklist: true,
    showMachineInfo: true,
    showCustomerDetails: true,
    builderConfig: {
      showBusinessProfile: true,
      showClientInfo: true,
      showTerms: true,
      showTable: true,
      showMachineInfo: true,
    },
  };
}

export const initialState: QuotationState = createFreshQuotation();

export type QuotationAction =
  | { type: "SET_BRANDING"; payload: Partial<QuotationState["branding"]> }
  | { type: "SET_DOCUMENT_INFO"; payload: Partial<QuotationState["documentInfo"]> }
  | { type: "SET_COMPANY"; payload: Partial<QuotationState["company"]> }
  | { type: "SET_CLIENT"; payload: Partial<QuotationState["client"]> }
  | { type: "SET_ITEMS"; payload: QuotationState["items"] }
  | { type: "ADD_ITEM"; payload: QuotationState["items"][0] }
  | { type: "UPDATE_ITEM"; payload: { id: string; updates: Partial<QuotationState["items"][0]> } }
  | { type: "DELETE_ITEM"; payload: string }
  | { type: "DUPLICATE_ITEM"; payload: string }
  | { type: "REORDER_ITEM"; payload: { id: string; direction: "up" | "down" } }
  | { type: "SET_TERMS"; payload: string }
  | { type: "SET_INTRO_TEXT"; payload: string }
  | { type: "SET_CURRENCY"; payload: Currency }
  | { type: "SET_DISCOUNT"; payload: { amount: number; type: "flat" | "percent" } }
  | { type: "SET_TAX_PERCENT"; payload: number }
  | { type: "SET_SHIPPING"; payload: number }
  | { type: "SET_SHOW_CHECKLIST"; payload: boolean }
  | { type: "SET_SHOW_MACHINE_INFO"; payload: boolean }
  | { type: "SET_SHOW_CUSTOMER_DETAILS"; payload: boolean }
  | { type: "SET_BUILDER_CONFIG"; payload: Partial<QuotationState["builderConfig"]> }
  | { type: "ADD_COLUMN"; payload: TableColumn }
  | { type: "DELETE_COLUMN"; payload: string }
  | { type: "UPDATE_COLUMN"; payload: { id: string; updates: Partial<TableColumn> } }
  | { type: "SET_COLUMNS"; payload: TableColumn[] }
  | { type: "NEW_QUOTATION" }
  | { type: "RESET"; payload: QuotationState };

export const quotationReducer = (state: QuotationState, action: QuotationAction): QuotationState => {
  switch (action.type) {
    case "SET_BRANDING":
      return { ...state, branding: { ...state.branding, ...action.payload } };
    case "SET_DOCUMENT_INFO":
      return { ...state, documentInfo: { ...state.documentInfo, ...action.payload } };
    case "SET_COMPANY":
      return { ...state, company: { ...state.company, ...action.payload } };
    case "SET_CLIENT":
      return { ...state, client: { ...state.client, ...action.payload } };
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
        ),
      };
    case "DELETE_ITEM":
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
    case "DUPLICATE_ITEM": {
      const itemToDup = state.items.find(item => item.id === action.payload);
      if (!itemToDup) return state;
      const dupIndex = state.items.findIndex(item => item.id === action.payload);
      const newItem = { ...itemToDup, id: Date.now().toString() };
      const newItems = [...state.items];
      newItems.splice(dupIndex + 1, 0, newItem);
      return { ...state, items: newItems };
    }
    case "REORDER_ITEM": {
      const idx = state.items.findIndex(item => item.id === action.payload.id);
      if (idx === -1) return state;
      const swapIdx = action.payload.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= state.items.length) return state;
      const reordered = [...state.items];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
      return { ...state, items: reordered };
    }
    case "SET_TERMS":
      return { ...state, terms: action.payload };
    case "SET_INTRO_TEXT":
      return { ...state, introText: action.payload };
    case "SET_CURRENCY":
      return { ...state, currency: action.payload };
    case "SET_DISCOUNT":
      return { ...state, discount: action.payload.amount, discountType: action.payload.type };
    case "SET_TAX_PERCENT":
      return { ...state, taxPercent: action.payload };
    case "SET_SHIPPING":
      return { ...state, shippingCharge: action.payload };
    case "SET_SHOW_CHECKLIST":
      return { ...state, showChecklist: action.payload };
    case "SET_SHOW_MACHINE_INFO":
      return { ...state, showMachineInfo: action.payload };
    case "SET_SHOW_CUSTOMER_DETAILS":
      return { ...state, showCustomerDetails: action.payload };
    case "SET_BUILDER_CONFIG":
      return { 
        ...state, 
        builderConfig: { ...state.builderConfig, ...action.payload } 
      };
    case "ADD_COLUMN":
      return { ...state, tableColumns: [...state.tableColumns, action.payload] };
    case "DELETE_COLUMN":
      return { ...state, tableColumns: state.tableColumns.filter(c => c.id !== action.payload) };
    case "UPDATE_COLUMN":
      return {
        ...state,
        tableColumns: state.tableColumns.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };
    case "SET_COLUMNS":
      return { ...state, tableColumns: action.payload };
    case "NEW_QUOTATION":
      // Keep company, branding, builderConfig, tableColumns, and terms — reset everything else
      return {
        ...createFreshQuotation(state.company, state.branding),
        terms: state.terms,
        tableColumns: state.tableColumns,
        builderConfig: state.builderConfig,
      };
    case "RESET":
      return { 
        ...initialState, 
        ...action.payload,
        branding: { ...initialState.branding, ...action.payload.branding },
        documentInfo: { ...initialState.documentInfo, ...action.payload.documentInfo },
        company: { ...initialState.company, ...action.payload.company },
        client: { ...initialState.client, ...action.payload.client },
        tableColumns: action.payload.tableColumns || initialState.tableColumns,
        builderConfig: { ...initialState.builderConfig, ...action.payload.builderConfig },
      };
    default:
      return state;
  }
};
