# QuoteCraft Implementation Plan

## Phase 0: Repository Audit & Baseline Verification (Completed)
- Inspected all routes, components, database access, types, and build status.
- Documented in `docs/QUOTECRAFT_AUDIT.md`.

## Phase 1: UX Architecture & Unified Navigation
- Update `src/components/layout/Sidebar.tsx` and mobile bottom navigation with 4 key destinations:
  - Dashboard (`/dashboard`)
  - Quotation Builder (`/` or `/builder`)
  - Quotations History (`/quotations`)
  - Settings (`/settings`)
- Ensure mobile safe area padding, touch target $\ge 44\text{px}$, and seamless active indicators.

## Phase 2: Quotation Persistence & Dashboard
- Implement `GET /api/quotations` to query the user's saved quotations in PostgreSQL with search, pagination, and status filters.
- Build `/dashboard/page.tsx` displaying:
  - Metric cards: Total Quotes, Drafts, Recent Activity (derived strictly from real data).
  - Quick action buttons: "New Quotation", "Import RFQ".
  - Recent Quotation list with quick actions: Edit in Builder, Download PDF, Duplicate.
- Build `/quotations/page.tsx` for full history list with search by quotation number, vessel, and buyer.

## Phase 3: 4-Step Quotation Flow Improvements
- **Step 1 (`Step1DocumentAndCustomer.tsx`):**
  - Unify Document Details (Type, Number, Dates, Vessel, Ref, Machinery Make/Model) and Customer Details (Buyer Company, Contact Person, WhatsApp Phone, Address) into a cohesive, non-blocking Step 1 form.
  - Add client autocomplete from previously saved quotes.
- **Step 2 (`Step2CheckItems.tsx`):**
  - Keep desktop spreadsheet review table.
  - Implement dedicated Mobile Item Cards avoiding horizontal table overflow.
  - Highlight missing fields (`qty <= 0` or empty name) without coercing missing values to 1.
- **Step 3 (`Step3AddPrices.tsx`):**
  - Maintain spreadsheet ergonomics (<kbd>Enter</kbd> navigation, Excel column paste).
  - Mobile price entry with dedicated large touch inputs.
  - Live calculations for subtotal, discount, tax, shipping, and grand total.
- **Step 4 (`Step4SendQuote.tsx`):**
  - Real A4 preview scaled responsively for both desktop and mobile viewports.
  - Instant PDF download and WhatsApp dispatch.

## Phase 4: Mobile Quotation Builder Polish
- Test and optimize layout on 360px, 390px, and 430px widths.
- Ensure all action buttons meet minimum 44px height.
- Sticky action bar with safe area inset at the bottom.

## Phase 5: RFQ Import Cost Optimization
- **Deterministic Excel Parser (`src/lib/rfq-parser.ts`):**
  - Inspect `.xlsx` worksheets, detect headers matching common patterns ("Description", "Item", "Part No", "Qty", "UOM", "Unit", "Price").
  - Extract rows directly using `exceljs` without sending to Gemini when high-confidence columns are detected.
  - Preserve missing fields as `null`/`""`. Flag missing values for user review.
- **Layered Fallback:**
  - Fall back to Gemini 2.5 Flash only when deterministic parsing fails or for digital/scanned PDFs and images.
  - Ensure strict schema validation and never silently coerce `quantity` to 1.
  - Add import review metadata (extraction method used, rows extracted, rows needing review).

## Phase 6 & 7: Customer Management & Quotation Actions
- Query previous quotations to provide recent client suggestions in Step 1.
- Implement "Duplicate Quotation" action: clones line items and client info while assigning a new quotation number and current date.

## Phase 8: Live Preview & Multi-Page PDF Polish
- Fix `PreviewContainer.tsx` so mobile users view the actual document layout scaled smoothly.
- Ensure `pdf-generator.ts` pagination handles 20+ line items without table header collisions or truncated totals.

## Phase 9 & 10: Reliability, Security & ESLint Cleanup
- Fix ESLint warnings and errors across all files.
- Ensure `middleware.ts` runs properly for NextAuth route protection.
- Validate file size limits (max 10MB) and MIME types on all upload endpoints.

## Phase 11 & 12: Production Build & QA Verification
- Run `tsc --noEmit` and `npm run lint`.
- Verify clean `npm run build`.
- Final audit and documentation updates.
