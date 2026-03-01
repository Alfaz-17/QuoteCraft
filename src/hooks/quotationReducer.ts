import { QuotationState, TableColumn } from "../types/quotation.types";

export const DEFAULT_COLUMNS: TableColumn[] = [
  { id: "sno", label: "S.No", key: "sno", type: "auto", visible: true, width: "50px" },
  { id: "name", label: "Item Name", key: "itemName", type: "text", visible: true },
  { id: "partNumber", label: "Part No.", key: "partNumber", type: "text", visible: true, width: "110px" },
  { id: "qty", label: "Qty", key: "quantity", type: "number", visible: true, width: "70px" },
  { id: "condition", label: "Condition", key: "condition", type: "text", visible: true, width: "100px" },
  { id: "rate", label: "Rate", key: "unitPrice", type: "number", visible: true, width: "90px" },
  { id: "total", label: "Total", key: "total", type: "auto", visible: true, width: "90px" },
];

export const initialState: QuotationState = {
  branding: {
    logo: null,
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    textColor: "#1e293b",
    font: "Inter",
    layout: "marine",
  },
  documentInfo: {
    type: "quotation",
    number: "QT-1001",
    date: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    vessel: "",
    scope: "MAIN ENGINE SPARES",
    make: "",
    model: "",
  },
  introText: "We hereby invite you to submit your best quotation for the items listed below. Kindly review the specifications and provide your detailed Commercial Proposal at your earliest convenience.",
  company: {
    name: "Aura Marine Solutions",
    address: "123 Port St, Maritime Hub, UAE",
    phone: "+971 50 123 4567",
    email: "info@auramarine.com",
  },
  client: {
    name: "",
    companyName: "",
    address: "",
    attn: "",
  },
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
  terms: "1. Delivery: 3-5 working days\n2. Warranty: 1 year standard\n3. Payment: 50% advance, 50% on delivery",
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

export type QuotationAction =
  | { type: "SET_BRANDING"; payload: Partial<QuotationState["branding"]> }
  | { type: "SET_DOCUMENT_INFO"; payload: Partial<QuotationState["documentInfo"]> }
  | { type: "SET_COMPANY"; payload: Partial<QuotationState["company"]> }
  | { type: "SET_CLIENT"; payload: Partial<QuotationState["client"]> }
  | { type: "SET_ITEMS"; payload: QuotationState["items"] }
  | { type: "ADD_ITEM"; payload: QuotationState["items"][0] }
  | { type: "UPDATE_ITEM"; payload: { id: string; updates: Partial<QuotationState["items"][0]> } }
  | { type: "DELETE_ITEM"; payload: string }
  | { type: "SET_TERMS"; payload: string }
  | { type: "SET_INTRO_TEXT"; payload: string }
  | { type: "SET_SHOW_CHECKLIST"; payload: boolean }
  | { type: "SET_SHOW_MACHINE_INFO"; payload: boolean }
  | { type: "SET_SHOW_CUSTOMER_DETAILS"; payload: boolean }
  | { type: "SET_BUILDER_CONFIG"; payload: Partial<QuotationState["builderConfig"]> }
  | { type: "ADD_COLUMN"; payload: TableColumn }
  | { type: "DELETE_COLUMN"; payload: string }
  | { type: "UPDATE_COLUMN"; payload: { id: string; updates: Partial<TableColumn> } }
  | { type: "SET_COLUMNS"; payload: TableColumn[] }
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
    case "SET_TERMS":
      return { ...state, terms: action.payload };
    case "SET_INTRO_TEXT":
      return { ...state, introText: action.payload };
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
