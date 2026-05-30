import { LineItem } from "../types/quotation.types";

export const calculateRowTotal = (item: LineItem): number => {
  return (item.quantity || 0) * (item.unitPrice || 0);
};

export const calculateSubtotal = (items: LineItem[]): number => {
  return items.reduce((acc, item) => acc + calculateRowTotal(item), 0);
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
