import { LineItem, TableColumn } from "../types/quotation.types";

/** "1,250.50", "USD 40", "12 pcs" -> number. Never returns NaN. */
export const toNumber = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const n = parseFloat(v.replace(/,/g, "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Key of the column that has the given role, or undefined. */
export const getRoleKey = (
  columns: TableColumn[] | undefined,
  role: "qty" | "price" | "total"
): string | undefined => columns?.find((c) => c.role === role)?.key;

/**
 * Row total = qty column x price column.
 * - No columns passed, or old saved columns without roles -> legacy quantity x unitPrice.
 * - Roles present but no qty column -> qty = 1 (lump-sum style sheets).
 */
export const calculateRowTotal = (item: LineItem, columns?: TableColumn[]): number => {
  const hasRoles = !!columns?.some((c) => c.role);
  if (!hasRoles) return toNumber(item.quantity) * toNumber(item.unitPrice);
  const qtyKey = getRoleKey(columns, "qty");
  const priceKey = getRoleKey(columns, "price");
  if (!priceKey) return 0;
  const qty = qtyKey ? toNumber(item[qtyKey]) : 1;
  return qty * toNumber(item[priceKey]);
};

export const calculateSubtotal = (items: LineItem[], columns?: TableColumn[]): number => {
  return items.reduce((acc, item) => acc + calculateRowTotal(item, columns), 0);
};

export const calculateDiscountAmount = (
  subtotal: number,
  discount: number,
  discountType: "flat" | "percent"
): number => {
  if (discountType === "percent") {
    return (subtotal * discount) / 100;
  }
  return discount;
};

export const calculateTaxAmount = (
  amountAfterDiscount: number,
  taxPercent: number
): number => {
  return (amountAfterDiscount * taxPercent) / 100;
};

export const calculateGrandTotal = (
  subtotal: number,
  discount: number,
  discountType: "flat" | "percent",
  taxPercent: number,
  shippingCharge: number
): number => {
  const discountAmt = calculateDiscountAmount(subtotal, discount, discountType);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = calculateTaxAmount(afterDiscount, taxPercent);
  return afterDiscount + taxAmt + shippingCharge;
};
