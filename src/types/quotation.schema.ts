import { z } from "zod";

export const lineItemSchema = z.object({
  id: z.string(),
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  partNumber: z.string().optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  itemType: z.string().optional(),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
}).passthrough(); // Allow extra dynamic fields

export const brandingSchema = z.object({
  logo: z.string().nullable(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  font: z.string(),
  layout: z.enum(["classic", "minimal", "technical", "marine"]),
});

export const documentInfoSchema = z.object({
  type: z.enum(["quotation", "rfq", "proforma"]),
  number: z.string().min(1, "Document number is required"),
  date: z.string().min(1, "Date is required"),
  validUntil: z.string().min(1, "Expiry date is required"),
  reference: z.string().optional(),
  project: z.string().optional(),
  vessel: z.string().optional(),
  scope: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
});

export const companyInfoSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Company address is required"),
  phone: z.string().min(1, "Company phone is required"),
  email: z.string().email("Invalid company email"),
  website: z.string().optional(),
  taxId: z.string().optional(),
});

export const clientInfoSchema = z.object({
  name: z.string(),
  companyName: z.string().optional(),
  address: z.string(),
  email: z.string().optional(),
  country: z.string().optional(),
  attn: z.string().optional(),
});

export const tableColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  key: z.string(),
  type: z.enum(["text", "number", "auto"]),
  visible: z.boolean(),
  width: z.string().optional(),
});

export const quotationSchema = z.object({
  branding: brandingSchema,
  documentInfo: documentInfoSchema,
  introText: z.string().optional(),
  company: companyInfoSchema,
  client: clientInfoSchema,
  items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  tableColumns: z.array(tableColumnSchema),
  terms: z.string().optional(),
  showChecklist: z.boolean().optional(),
  showMachineInfo: z.boolean().optional(),
  showCustomerDetails: z.boolean().optional(),
});

export type QuotationSchema = z.infer<typeof quotationSchema>;
