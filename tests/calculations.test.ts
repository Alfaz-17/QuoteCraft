import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  toNumber,
  roundToTwo,
  calculateRowTotal,
  calculateSubtotal,
  calculateDiscountAmount,
  calculateTaxAmount,
  calculateGrandTotal,
} from "../src/utils/calculations";
import { LineItem, TableColumn } from "../src/types/quotation.types";

describe("calculations.ts - Quotation Financial & Math Engine", () => {
  describe("toNumber", () => {
    test("parses integers and floats", () => {
      assert.equal(toNumber(42), 42);
      assert.equal(toNumber(19.99), 19.99);
      assert.equal(toNumber(0), 0);
    });

    test("cleans currency and punctuation strings", () => {
      assert.equal(toNumber("1,250.50"), 1250.5);
      assert.equal(toNumber("$450.00"), 450);
      assert.equal(toNumber("USD 99.5"), 99.5);
      assert.equal(toNumber("12 pcs"), 12);
      assert.equal(toNumber("€ 3,400.75"), 3400.75);
    });

    test("safely defaults invalid values to 0 without throwing or returning NaN", () => {
      assert.equal(toNumber(null), 0);
      assert.equal(toNumber(undefined), 0);
      assert.equal(toNumber("N/A"), 0);
      assert.equal(toNumber(""), 0);
      assert.equal(toNumber(NaN), 0);
    });
  });

  describe("roundToTwo", () => {
    test("accurately rounds to two decimal places without float drift", () => {
      assert.equal(roundToTwo(10.333333), 10.33);
      assert.equal(roundToTwo(10.335), 10.34);
      assert.equal(roundToTwo(1.005), 1.01);
      assert.equal(roundToTwo(0), 0);
      assert.equal(roundToTwo(NaN), 0);
    });
  });

  describe("calculateRowTotal", () => {
    test("calculates standard legacy item quantity * unitPrice with rounding", () => {
      const item: LineItem = {
        id: "1",
        itemName: "Fuel Filter",
        quantity: 3,
        unit: "pcs",
        unitPrice: 10.33333,
      };
      // 3 * 10.33333 = 30.99999 -> rounds to 31
      assert.equal(calculateRowTotal(item), 31);
    });

    test("calculates row total using dynamic table columns with qty and price roles", () => {
      const columns: TableColumn[] = [
        { id: "col1", label: "Desc", key: "c1", type: "text", visible: true },
        { id: "col2", label: "Req Qty", key: "c2", type: "number", role: "qty", visible: true },
        { id: "col3", label: "Unit Rate", key: "c3", type: "number", role: "price", visible: true },
      ];
      const item: LineItem = {
        id: "item-1",
        itemName: "Gasket",
        quantity: 0,
        unitPrice: 0,
        unit: "pcs",
        c1: "Cylinder head gasket",
        c2: "5",
        c3: "120.50",
      };
      assert.equal(calculateRowTotal(item, columns), 602.5);
    });

    test("defaults qty to 1 when role 'price' exists but no 'qty' role exists (lump sum)", () => {
      const columns: TableColumn[] = [
        { id: "col1", label: "Description", key: "c1", type: "text", visible: true },
        { id: "col2", label: "Lump Sum", key: "c2", type: "number", role: "price", visible: true },
      ];
      const item: LineItem = {
        id: "item-2",
        itemName: "Overhaul Service",
        quantity: 0,
        unitPrice: 0,
        unit: "service",
        c1: "Main Engine Inspection",
        c2: "2500.00",
      };
      assert.equal(calculateRowTotal(item, columns), 2500);
    });

    test("prevents negative totals from invalid inputs", () => {
      const item: LineItem = {
        id: "3",
        itemName: "Invalid",
        quantity: -5,
        unit: "pcs",
        unitPrice: -20,
      };
      assert.equal(calculateRowTotal(item), 0);
    });
  });

  describe("calculateSubtotal", () => {
    test("sums line items accurately", () => {
      const items: LineItem[] = [
        { id: "1", itemName: "Item 1", quantity: 2, unit: "pcs", unitPrice: 50.25 },
        { id: "2", itemName: "Item 2", quantity: 4, unit: "pcs", unitPrice: 24.75 },
      ];
      // 2 * 50.25 = 100.50; 4 * 24.75 = 99.00 -> 199.50
      assert.equal(calculateSubtotal(items), 199.5);
    });

    test("handles empty items array", () => {
      assert.equal(calculateSubtotal([]), 0);
    });
  });

  describe("calculateDiscountAmount (Defense against negative total)", () => {
    test("calculates percentage discount accurately", () => {
      assert.equal(calculateDiscountAmount(1000, 15, "percent"), 150);
      assert.equal(calculateDiscountAmount(250, 10, "percent"), 25);
    });

    test("caps percentage discount at 100% maximum", () => {
      assert.equal(calculateDiscountAmount(500, 150, "percent"), 500);
    });

    test("calculates flat discount accurately", () => {
      assert.equal(calculateDiscountAmount(1000, 120, "flat"), 120);
    });

    test("CAPS flat discount to subtotal to prevent negative totals", () => {
      // Subtotal is $300, user attempts $500 discount -> capped at $300
      assert.equal(calculateDiscountAmount(300, 500, "flat"), 300);
    });
  });

  describe("calculateTaxAmount", () => {
    test("computes tax percentage on amount after discount", () => {
      // $1000 at 5% VAT = $50
      assert.equal(calculateTaxAmount(1000, 5), 50);
      // $250.50 at 18% GST = $45.09
      assert.equal(calculateTaxAmount(250.5, 18), 45.09);
    });
  });

  describe("calculateGrandTotal", () => {
    test("calculates full total: (Subtotal - Discount) + Tax + Shipping", () => {
      // Subtotal: 1000, Discount: 100 (flat), After: 900, Tax (10%): 90, Shipping: 50
      // Expected: 900 + 90 + 50 = 1040.00
      const total = calculateGrandTotal(1000, 100, "flat", 10, 50);
      assert.equal(total, 1040);
    });

    test("never yields negative grand total even with oversized discount or negative shipping", () => {
      const total = calculateGrandTotal(200, 9999, "flat", 10, -50);
      // Discount capped at 200 -> afterDiscount = 0, tax = 0, shipping sanitized to 0 -> total = 0
      assert.equal(total, 0);
    });
  });
});
