# QuoteCraft QA & Responsive Test Plan

## 1. Responsive Viewport Verification Matrix

| Viewport Category | Width | Height | Device Target | Key Checks |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Compact** | 360px | 740px | Galaxy S8 / Android Small | Touch target $\ge 44\text{px}$, bottom nav visibility, no horizontal table clipping, card stacked layout. |
| **Mobile Standard** | 390px | 844px | iPhone 12/13/14/15 | Bottom safe area inset, step pill scroll/fit, review card edit buttons. |
| **Mobile Large** | 430px | 932px | iPhone 15 Pro Max | Sticky financial summary dock readability, price keypad input. |
| **Tablet Portrait** | 768px | 1024px | iPad Mini / Air | Sidebar vs bottom nav transition, layout wrapping. |
| **Laptop** | 1024px | 768px | MacBook 13 / Surface | Desktop sidebar visible, 2-column spreadsheet layout. |
| **Desktop HD** | 1280px | 800px | Standard Monitor | Full spreadsheet ergonomics (<kbd>Enter</kbd> navigation, column paste). |
| **Desktop Full HD**| 1440px+ | 900px | Pro Monitor | High-res preview container, centered max-w layout. |

---

## 2. Core Functional Test Scenarios

1. **Scenario 1: Manual Quotation Creation**
   - Fill Document Type, Quote No, Dates, Vessel Name, Customer Details in Step 1.
   - Proceed to Step 2 and add 3 blank items. Enter names, part numbers, and quantities.
   - Proceed to Step 3 and assign unit prices.
   - Verify Grand Total = (Subtotal - Discount) + Tax + Shipping.
   - Proceed to Step 4, preview document, and trigger PDF download.
   - Verify PDF downloads with all entered information.

2. **Scenario 2: Deterministic Excel RFQ Import**
   - Upload standard marine spare parts `.xlsx` spreadsheet.
   - Verify extraction runs deterministically with `$0.00` API cost.
   - Verify rows appear in Step 2 with original part numbers and quantities preserved.
   - Verify any missing quantity is flagged for user confirmation.

3. **Scenario 3: AI RFQ Fallback Import**
   - Paste unstructured text from email or WhatsApp.
   - Verify Gemini model extracts structured items.
   - Review extracted items, edit flagged entries, and approve import.

4. **Scenario 4: Multi-Item Quotation & Multi-Page PDF**
   - Generate quotation with 25+ line items.
   - Preview in Step 4 and download PDF.
   - Verify PDF page numbering ("Page X of Y"), repeating table headers, and proper margins without overlapping totals.

5. **Scenario 5: State Persistence & Reload**
   - Make rapid edits across Step 1, 2, and 3.
   - Refresh browser page (`F5`).
   - Verify draft restores completely from `localStorage` and background cloud sync.

6. **Scenario 6: User Data Isolation**
   - Verify user A cannot query or modify user B's quotations.
   - Verify all database calls include authenticated `userId` in query conditions.
