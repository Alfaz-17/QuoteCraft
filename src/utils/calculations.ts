import { LineItem } from "../types/quotation.types";

export const calculateRowTotal = (item: LineItem): number => {
  return (item.quantity || 0) * (item.unitPrice || 0);
};

export const calculateSubtotal = (items: LineItem[]): number => {
  return items.reduce((acc, item) => acc + calculateRowTotal(item), 0);
};
