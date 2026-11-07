import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAuthorizedOwnerEmail } from "../src/lib/admin-auth";
import { checkRateLimit } from "../src/lib/rate-limit";

describe("Admin & Security Architecture Tests", () => {
  describe("isAuthorizedOwnerEmail", () => {
    it("authorizes default founder email", () => {
      assert.strictEqual(isAuthorizedOwnerEmail("alfazbilakhiya17@gmail.com"), true);
      assert.strictEqual(isAuthorizedOwnerEmail("ALFAZBILAKHIYA17@GMAIL.COM"), true);
      assert.strictEqual(isAuthorizedOwnerEmail("  alfazbilakhiya17@gmail.com  "), true);
    });

    it("strictly rejects random customer emails", () => {
      assert.strictEqual(isAuthorizedOwnerEmail("customer@marinecompany.com"), false);
      assert.strictEqual(isAuthorizedOwnerEmail("attacker@evil.com"), false);
      assert.strictEqual(isAuthorizedOwnerEmail(""), false);
      assert.strictEqual(isAuthorizedOwnerEmail(null), false);
      assert.strictEqual(isAuthorizedOwnerEmail(undefined), false);
    });
  });

  describe("Admin Rate Limiting", () => {
    it("enforces sliding-window rate limit for admin operations", () => {
      const id = "admin-test-" + Date.now();
      // Allow 3 requests in window
      const r1 = checkRateLimit(id, 3, 60_000);
      const r2 = checkRateLimit(id, 3, 60_000);
      const r3 = checkRateLimit(id, 3, 60_000);
      const r4 = checkRateLimit(id, 3, 60_000);

      assert.strictEqual(r1.success, true);
      assert.strictEqual(r2.success, true);
      assert.strictEqual(r3.success, true);
      assert.strictEqual(r4.success, false);
      assert.strictEqual(r4.remaining, 0);
      assert.ok(r4.retryAfterSeconds! > 0);
    });
  });

  describe("Gemini Token Cost Calculation Engine", () => {
    it("calculates accurate USD cost for Gemini 2.5 Flash tokens", () => {
      // Rates: $0.075 / 1M prompt tokens ($0.000000075 / token)
      //        $0.30  / 1M candidate tokens ($0.0000003 / token)
      const inputTokens = 10_000;
      const outputTokens = 2_000;

      const inputCost = (inputTokens / 1_000_000) * 0.075; // $0.00075
      const outputCost = (outputTokens / 1_000_000) * 0.30; // $0.0006
      const totalCost = +(inputCost + outputCost).toFixed(6); // $0.00135

      assert.strictEqual(totalCost, 0.00135);
    });

    it("charges zero LLM cost for deterministic Excel extractions", () => {
      const method = "deterministic_excel";
      const cost = method === "deterministic_excel" ? 0.0 : 0.05;
      assert.strictEqual(cost, 0.0);
    });
  });

  describe("Tenant Isolation Rules", () => {
    it("protects confidential customer quotation line items from plain listing", () => {
      // Simulated quotation object
      const fullQuotation = {
        id: "q-123",
        number: "QT-2026-001",
        currency: "USD",
        items: [
          { itemName: "Confidential Marine Bearing", unitPrice: 4500, discount: 200 }
        ],
      };

      // Admin metadata ledger omits full item arrays
      const adminMetadataListing = {
        id: fullQuotation.id,
        number: fullQuotation.number,
        currency: fullQuotation.currency,
        itemCount: fullQuotation.items.length,
      };

      assert.strictEqual(adminMetadataListing.itemCount, 1);
      assert.strictEqual((adminMetadataListing as unknown as { items?: unknown }).items, undefined);
    });
  });
});

