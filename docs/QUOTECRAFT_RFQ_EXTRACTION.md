# QuoteCraft RFQ Extraction & Cost Optimization Architecture

## 1. Problem Statement & Cost Drivers
Marine suppliers receive numerous RFQs daily via email attachments (Excel spreadsheets and PDFs) and WhatsApp messages. Calling an LLM like Gemini 2.5 Flash for every single file or message incurs recurring API costs, rate-limit risks, and latency.

Furthermore, spreadsheets already possess structured tabular data. Using AI to parse a well-formatted `.xlsx` file is wasteful, slow, and prone to hallucinations (e.g. guessing missing quantities or truncating long part descriptions).

---

## 2. Layered Extraction Architecture

```
                 Incoming Buyer RFQ File / Text
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   Excel File (.xlsx/.xls/.csv)           PDF / Image / Raw Text
            │                                     │
   [Deterministic Parser]                 [Check Digital Text]
   Inspect sheets, headers, rows                  │
            │                                     ├─ Extractable text?
            ├─ High-confidence headers?           │    │
            │  (Item, Part#, Qty, Unit)           │    ▼
            │                                     │  [Deterministic Tabular Match]
       YES ─┴─ NO                                 │  If standard table detected
        │       │                                 │    │
        ▼       └──────────────┬──────────────────┘    ▼
 [Pure JS Extraction]          │                      YES -> Pure JS Extraction
   - Zero API Cost             ▼                       NO  -> AI Fallback
   - Instant (<50ms)     [Gemini 2.5 Flash AI Fallback]
   - 100% Deterministic   - Strict JSON Schema
   - Missing flags intact - Preserves empty fields
                               │
                               ▼
               [Unified Extraction Review Queue]
               - Items marked 'verified' or 'needs_review'
               - Never silently convert missing values
               - User confirms & edits before insertion
```

---

## 3. Strict Rules for Extraction & Review
1. **Never Silently Default Missing Values:**
   - If a quantity is omitted in the buyer RFQ, it is flagged as `needs_review` with `quantity: 0` or empty, prompting the user. It must NEVER be defaulted to 1 without user confirmation.
   - If a part number is missing, it remains empty and is not synthesized.
2. **Deterministic Header Recognition:**
   - Header patterns checked case-insensitively:
     - `name`: `item`, `description`, `item description`, `material`, `particulars`, `scope`
     - `partNumber`: `part no`, `part #`, `drawing no`, `dwg no`, `position`, `pos #`, `impa`, `issa`, `code`
     - `quantity`: `qty`, `quantity`, `qnty`, `req qty`, `required quantity`
     - `unit`: `uom`, `unit`, `unit of measurement`, `pkg`
     - `condition`: `condition`, `state`, `type`
     - `unitPrice`: `price`, `unit price`, `rate`, `unit rate`, `cost`
3. **Execution Instrumentation:**
   Every extraction returns metadata:
   - `method`: `"deterministic_excel"` | `"deterministic_text"` | `"gemini_multimodal"` | `"gemini_text"`
   - `durationMs`: Processing time in milliseconds
   - `totalRows`: Total line items detected
   - `uncertainRows`: Number of rows flagged for review
   - `cost`: `$0.00` for deterministic runs vs token estimate for AI runs
