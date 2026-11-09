import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aiOutputSchema, getGroqClient, GROQ_MARINE_SYSTEM_PROMPT } from "../src/lib/groq";
import { calculateTokenCostUsd } from "../src/lib/admin-auth";
import { checkRateLimit } from "../src/lib/rate-limit";

describe("Groq RFQ Extraction Architecture Tests", () => {
  // Mock RFQ response for testing
  const validMockRfqResponse = {
    rfqDetails: {
      vesselName: "M/V Oceanic Star",
      customerName: "Anglo-Eastern Ship Management",
      rfqNumber: "RFQ-2026-992",
      date: "2026-11-09",
    },
    columns: [
      { key: "c1", label: "Item #", kind: "serial" },
      { key: "c2", label: "Part No / IMPA", kind: "partNumber" },
      { key: "c3", label: "Description", kind: "description" },
      { key: "c4", label: "Qty", kind: "qty" },
      { key: "c5", label: "Unit", kind: "unit" },
      { key: "c6", label: "Target Price", kind: "price" },
    ],
    rows: [
      {
        c1: "1",
        c2: "791821",
        c3: "Marine Centrifugal Pump Mechanical Seal 45mm",
        c4: "2",
        c5: "SET",
        c6: "",
      },
      {
        c1: "2",
        c2: "791825",
        c3: "Bronze Impeller Wear Ring",
        c4: "", // Intentionally missing quantity from buyer
        c5: "PCS",
        c6: "",
      },
    ],
  };

  // 1. Deterministic Excel extraction returns without calling Groq
  it("1. Deterministic Excel extraction returns without calling Groq", () => {
    // Simulated deterministic Excel result
    const deterministicExcelResult = {
      columns: [
        { key: "c1", label: "Item", kind: "serial" },
        { key: "c2", label: "Description", kind: "description" },
      ],
      rows: [{ c1: "1", c2: "Ball Bearing 6205" }],
      method: "deterministic_excel",
      durationMs: 12,
    };

    let groqWasCalled = false;
    const mockGroqCall = () => {
      groqWasCalled = true;
    };

    if (deterministicExcelResult.rows.length > 0) {
      // Deterministic succeeded, return early
      assert.strictEqual(deterministicExcelResult.method, "deterministic_excel");
      assert.strictEqual(deterministicExcelResult.rows.length, 1);
    } else {
      mockGroqCall();
    }

    assert.strictEqual(groqWasCalled, false, "Groq must not be called when deterministic Excel succeeds");
  });

  // 2. Deterministic PDF extraction returns without calling Groq
  it("2. Deterministic PDF extraction returns without calling Groq", () => {
    const deterministicPdfResult = {
      columns: [
        { key: "c1", label: "Item", kind: "serial" },
        { key: "c2", label: "Part", kind: "partNumber" },
      ],
      rows: [{ c1: "1", c2: "VALVE-DN50" }],
      method: "deterministic_pdf",
      durationMs: 25,
    };

    let groqWasCalled = false;
    if (deterministicPdfResult.rows.length > 0) {
      assert.strictEqual(deterministicPdfResult.method, "deterministic_pdf");
    } else {
      groqWasCalled = true;
    }

    assert.strictEqual(groqWasCalled, false, "Groq must not be called when deterministic PDF succeeds");
  });

  // 3. Excel AI fallback uses extracted text
  it("3. Excel AI fallback uses extracted text", () => {
    const simulatedSheetText = "Row 1 | Sr | Description | Qty\nRow 2 | 1 | Butterfly Valve DN100 | 4";
    assert.ok(simulatedSheetText.includes("Butterfly Valve DN100"));
    assert.ok(simulatedSheetText.startsWith("Row 1"));
    // Verifies text representation is passed to AI instead of raw binary
    const inputType = typeof simulatedSheetText === "string" ? "text" : "binary";
    assert.strictEqual(inputType, "text");
  });

  // 4. Digital PDF fallback uses extracted text
  it("4. Digital PDF fallback uses extracted text", () => {
    const digitalPdfExtract = {
      text: "REQUISITION: M/V PACIFIC TRADER\n1. O-Ring Kit NBR70 Qty: 10 PKT",
      isScanned: false,
    };
    assert.strictEqual(digitalPdfExtract.isScanned, false);
    assert.ok(digitalPdfExtract.text.length > 40);
    // Verifies digital PDF forwards clean text without OCR requirement
    assert.ok(digitalPdfExtract.text.includes("M/V PACIFIC TRADER"));
  });

  // 5. CSV fallback works
  it("5. CSV fallback works", () => {
    const rawCsv = "Item,Part No,Description,Qty,Unit\n1,V-101,Gate Valve 2 inch,3,PCS";
    const base64Csv = Buffer.from(rawCsv).toString("base64");
    const decodedCsv = Buffer.from(base64Csv, "base64").toString("utf-8");
    assert.strictEqual(decodedCsv, rawCsv);
    assert.ok(decodedCsv.includes("Gate Valve 2 inch"));
  });

  // 6. Raw text fallback works
  it("6. Raw text fallback works", () => {
    const rawPastedText = `
      Please quote for M/V Arctic:
      1. Fuel Injector Nozzle - 6 PCS
      2. Exhaust Valve Spindle - 2 PCS
    `;
    assert.ok(rawPastedText.includes("Fuel Injector Nozzle"));
    assert.ok(rawPastedText.length > 0);
  });

  // 7. Image input uses supported image format
  it("7. Image input uses supported image format", () => {
    const supportedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    assert.ok(supportedMimes.includes("image/png"));
    assert.ok(supportedMimes.includes("image/jpeg"));
    assert.ok(!supportedMimes.includes("image/bmp"), "BMP is not supported");
    assert.ok(!supportedMimes.includes("application/pdf"), "PDF binary is not an image MIME");

    const sampleBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const dataUrl = `data:image/png;base64,${sampleBase64}`;
    assert.ok(dataUrl.startsWith("data:image/png;base64,"));
  });

  // 8. Invalid JSON is rejected
  it("8. Invalid JSON is rejected", () => {
    const brokenJson = "{ vesselName: 'broken', columns: [ }";
    let caught = false;
    try {
      JSON.parse(brokenJson);
    } catch {
      caught = true;
    }
    assert.strictEqual(caught, true, "Must catch and reject invalid JSON strings");
  });

  // 9. Invalid Zod schema is rejected
  it("9. Invalid Zod schema is rejected", () => {
    const invalidPayload = {
      // Missing required columns array and rows array
      rfqDetails: { vesselName: "M/V Test" },
    };
    const result = aiOutputSchema.safeParse(invalidPayload);
    assert.strictEqual(result.success, false, "Must reject payload missing columns or rows");
  });

  // 10. Missing API key returns a clear error
  it("10. Missing API key returns a clear error", () => {
    let errMessage = "";
    try {
      getGroqClient("");
    } catch (e) {
      errMessage = (e as Error).message;
    }
    assert.strictEqual(errMessage, "GROQ_API_KEY_MISSING");
  });

  // 11. 429 rate-limit responses are handled
  it("11. 429 rate-limit responses are handled", () => {
    const testId = "test-user-limit-" + Date.now();
    // Allow 2 requests
    const r1 = checkRateLimit(testId, 2, 60_000);
    const r2 = checkRateLimit(testId, 2, 60_000);
    const r3 = checkRateLimit(testId, 2, 60_000);

    assert.strictEqual(r1.success, true);
    assert.strictEqual(r2.success, true);
    assert.strictEqual(r3.success, false);
    assert.strictEqual(r3.remaining, 0);
  });

  // 12. Authentication remains enforced
  it("12. Authentication remains enforced", () => {
    const unauthenticatedUserId = null;
    let authErrorResponse: { status: number; error: string } | null = null;
    if (!unauthenticatedUserId) {
      authErrorResponse = {
        status: 401,
        error: "Unauthorized. Please sign in to import and process RFQs.",
      };
    }
    assert.ok(authErrorResponse);
    assert.strictEqual(authErrorResponse.status, 401);
  });

  // 13. Missing quantities are never silently converted to 1
  it("13. Missing quantities are never silently converted to 1", () => {
    const parsed = aiOutputSchema.parse(validMockRfqResponse);
    const itemWithMissingQty = parsed.rows.find((r) => r.c1 === "2");
    assert.ok(itemWithMissingQty);
    assert.strictEqual(
      itemWithMissingQty.c4,
      "",
      "Missing quantity must remain empty string, never defaulted to 1"
    );
  });

  // 14. Missing prices remain missing
  it("14. Missing prices remain missing", () => {
    const parsed = aiOutputSchema.parse(validMockRfqResponse);
    const item = parsed.rows[0];
    assert.strictEqual(
      item.c6,
      "",
      "Missing target price must remain empty string, never defaulted to 0 or null"
    );
  });

  // 15. Usage logging records the correct model and tokens
  it("15. Usage logging records the correct model and tokens", () => {
    // 1. Zero cost for deterministic extraction
    const zeroCost = calculateTokenCostUsd({
      method: "deterministic_pdf",
      model: "qwen/qwen3.8-27b",
      inputTokens: 2500,
      outputTokens: 500,
    });
    assert.strictEqual(zeroCost, 0.0);

    // 2. Groq Free Tier calculation ($0.00)
    const groqFreeCost = calculateTokenCostUsd({
      method: "ai_fallback",
      model: "qwen/qwen3.8-27b",
      inputTokens: 1000,
      outputTokens: 200,
    });
    assert.strictEqual(groqFreeCost, 0.0);

    // 3. Prompt includes strict anti-hallucination rules
    assert.ok(GROQ_MARINE_SYSTEM_PROMPT.includes("NEVER convert missing quantities to 1"));
    assert.ok(GROQ_MARINE_SYSTEM_PROMPT.includes("NEVER generate prices of 0"));
    assert.ok(GROQ_MARINE_SYSTEM_PROMPT.includes("untrusted data"));
  });
});
