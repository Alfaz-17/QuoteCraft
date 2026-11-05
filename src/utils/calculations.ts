import { LineItem, TableColumn } from "../types/quotation.types";

/**
 * Standard 2-decimal-place rounding with floating point epsilon correction.
 * Prevents precision drift (e.g. 1.005 -> 1.01 instead of 1.00).
 */
export const roundToTwo = (num: number): number => {
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

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
 * Row total = qty column x price column, rounded to 2 decimal places per line item.
 * - Enforces per-line rounding so printed line totals strictly add up to subtotal.
 * - Prevents negative values from invalid inputs.
 */
export const calculateRowTotal = (item: LineItem, columns?: TableColumn[]): number => {
  const hasRoles = !!columns?.some((c) => c.role);
  let qty = 1;
  let price = 0;

  if (!hasRoles) {
    qty = toNumber(item.quantity);
    price = toNumber(item.unitPrice);
  } else {
    const qtyKey = getRoleKey(columns, "qty");
    const priceKey = getRoleKey(columns, "price");
    if (!priceKey) return 0;
    qty = qtyKey ? toNumber(item[qtyKey]) : 1;
    price = toNumber(item[priceKey]);
  }

  const raw = Math.max(0, qty) * Math.max(0, price);
  return roundToTwo(raw);
};

/**
 * Subtotal is the exact sum of line-by-line rounded row totals.
 */
export const calculateSubtotal = (items: LineItem[], columns?: TableColumn[]): number => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + calculateRowTotal(item, columns), 0);
  return roundToTwo(sum);
};

/**
 * Discount amount calculation:
 * - Percentage: capped between 0% and 100%.
 * - Flat: capped at subtotal (discount can NEVER exceed subtotal to prevent negative totals).
 */
export const calculateDiscountAmount = (
  subtotal: number,
  discount: number,
  discountType: "flat" | "percent"
): number => {
  const cleanSubtotal = Math.max(0, toNumber(subtotal));
  const cleanDiscount = Math.max(0, toNumber(discount));

  if (discountType === "percent") {
    const clampedPercent = Math.min(100, cleanDiscount);
    return roundToTwo((cleanSubtotal * clampedPercent) / 100);
  }
  return roundToTwo(Math.min(cleanSubtotal, cleanDiscount));
};

/**
 * Tax amount calculated on amount after discount, rounded to 2 decimals.
 */
export const calculateTaxAmount = (
  amountAfterDiscount: number,
  taxPercent: number
): number => {
  const base = Math.max(0, toNumber(amountAfterDiscount));
  const rate = Math.max(0, toNumber(taxPercent));
  return roundToTwo((base * rate) / 100);
};

/**
 * Grand total = (Subtotal - Discount) + Tax + ShippingCharge
 * Fully sanitized and rounded to 2 decimal places.
 */
export const calculateGrandTotal = (
  subtotal: number,
  discount: number,
  discountType: "flat" | "percent",
  taxPercent: number,
  shippingCharge: number
): number => {
  const cleanSubtotal = Math.max(0, toNumber(subtotal));
  const discountAmt = calculateDiscountAmount(cleanSubtotal, discount, discountType);
  const afterDiscount = Math.max(0, roundToTwo(cleanSubtotal - discountAmt));
  const taxAmt = calculateTaxAmount(afterDiscount, taxPercent);
  const cleanShipping = Math.max(0, roundToTwo(toNumber(shippingCharge)));
  return roundToTwo(afterDiscount + taxAmt + cleanShipping);
};
