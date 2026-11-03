# QuoteCraft Comprehensive Repository Audit

**Date:** 2026-11-03  
**Auditor:** Senior Full-Stack Engineer, Product Designer, UX Architect & QA Engineer  
**Repository:** `Alfaz-17/QuoteCraft` (`Marine-Quataion generator`)  
**Runtime & Tooling Verified:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5, Prisma 7.8.0, `@prisma/client` 7.8.0, NextAuth 4.24.13, Tailwind CSS v4 (`@tailwindcss/postcss` 4), PostgreSQL via `pg` (8.21.0 Pool directly connecting to Neon/Supabase), Gemini AI via `@google/generative-ai` 0.24.1, ExcelJS 4.4.0, jsPDF 4.2.0, jspdf-autotable 5.0.7, `@react-pdf/renderer` 4.3.2.

---

## 1. Confirmed Existing Features (With File Paths & Evidence)

1. **Authentication & Session Management:**
   - **File:** [src/lib/auth.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/lib/auth.ts), [src/app/api/auth/[...nextauth]/route.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/api/auth/[...nextauth]/route.ts), [src/app/api/auth/register/route.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/api/auth/register/route.ts), [src/proxy.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/proxy.ts).
   - **Evidence:** Credentials provider supporting phone or email login. Password hashed with `bcryptjs` (salt rounds 12). JWT session strategy with 30-day expiry. Route proxy protecting all paths except `/login`, `/register`, and static assets.
   
2. **User Settings & Per-User Gemini API Key:**
   - **File:** [src/app/settings/page.tsx](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/settings/page.tsx), [src/app/api/user/settings/route.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/api/user/settings/route.ts), [src/app/api/user/profile/route.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/api/user/profile/route.ts).
   - **Evidence:** `geminiApiKey` stored on the `User` table; passwords can be updated via `/api/user/change-password`; company profile, branding options, and default terms can be configured.

3. **Quotation State Management & Autosave:**
   - **File:** [src/hooks/useQuotationState.tsx](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/hooks/useQuotationState.tsx), [src/hooks/quotationReducer.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/hooks/quotationReducer.ts), [src/types/quotation.types.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/types/quotation.types.ts).
   - **Evidence:** Reducer manages line items, dynamic columns, document metadata, currency, discounts, taxes, and shipping. Dual persistence: debounced `localStorage` saving (600ms) with quota fallback, plus cloud sync to `/api/quotation/save` (2000ms debounce).

4. **Quotation Pricing Calculation Engine:**
   - **File:** [src/utils/calculations.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/utils/calculations.ts).
   - **Evidence:** `toNumber`, `getRoleKey`, `calculateRowTotal`, `calculateSubtotal`, `calculateDiscountAmount`, `calculateTaxAmount`, and `calculateGrandTotal`. Supports both flat and percentage discounts, custom tax percentage, and shipping charges.

5. **Multi-Currency Support:**
   - **File:** [src/types/quotation.types.ts#L67-L77](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/types/quotation.types.ts#L67-L77).
   - **Evidence:** Pre-configured currency definitions and symbols for `USD`, `EUR`, `GBP`, `AED`, `INR`, `SGD`, and `JPY`.

6. **RFQ Document Import (Multimodal AI & Excel Text Extraction):**
   - **File:** [src/app/api/ai/import-rfq/route.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/api/ai/import-rfq/route.ts), [src/lib/rfq-parser.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/lib/rfq-parser.ts), [src/utils/importMapping.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/utils/importMapping.ts).
   - **Evidence:** Server converts `.xlsx` to tab-separated text via `ExcelJS` before passing to Gemini 2.5 Flash; images and PDFs passed as base64 inline data; AI extracts column classification and row records.

7. **PDF Generation (jsPDF + AutoTable):**
   - **File:** [src/lib/pdf-generator.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/lib/pdf-generator.ts).
   - **Evidence:** Uses `jsPDF` and `jspdf-autotable` to generate professional multi-page quotations with custom colors, header branding, vessel & reference info, machine specs, items table, and terms.

8. **WhatsApp Share:**
   - **File:** [src/components/flow/Step4SendQuote.tsx#L65-L95](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/components/flow/Step4SendQuote.tsx#L65-L95).
   - **Evidence:** Encodes quotation summary, total, vessel, and buyer contact into `wa.me` URL.

---

## 2. Features Partially Implemented

1. **Deterministic RFQ Spreadsheet Parsing:**
   - **Location:** [src/lib/rfq-parser.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/lib/rfq-parser.ts), [src/app/api/ai/import-rfq/route.ts#L71-L79](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/api/ai/import-rfq/route.ts#L71-L79).
   - **Issue:** Excel parsing uses `ExcelJS` only to dump text to Gemini (`xlsxToText`), incurring LLM API cost on every Excel upload, rather than extracting headers, rows, part numbers, and quantities deterministically first.
   
2. **Missing Extraction Review & Confidence Validation:**
   - **Location:** [src/utils/importMapping.ts#L89-L91](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/utils/importMapping.ts#L89-L91).
   - **Issue:** If quantity is missing or 0, `mapImport` silently defaults: `if (!item.quantity) item.quantity = 1;`. This violates Non-Negotiable Rule 8: *"Never silently convert missing quantity to 1 or missing price to 0 during RFQ extraction. Preserve missing values and require user confirmation."*

3. **Quotation History & Persistence:**
   - **Location:** [src/app/api/quotation/save/route.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/app/api/quotation/save/route.ts), [src/lib/prisma.ts#L82-L168](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/lib/prisma.ts#L82-L168).
   - **Issue:** Quotations are saved and updated in the `Quotation` table in PostgreSQL by number, but there is NO endpoint to list user quotations (`GET /api/quotation`), no quotation history UI, and no dashboard page.

4. **Customer Records:**
   - **Location:** [prisma/schema.prisma](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/prisma/schema.prisma).
   - **Issue:** Customer details (`client`) are stored merely as raw JSON blobs inside individual quotations and user drafts. There is no dedicated `Customer` model or lookup to reuse repeat clients without retyping.

5. **Two Divergent Builder UIs:**
   - **Location:** `src/components/builder/` (older split-screen tab UI with `ItemsTable.tsx`, `DocumentInfoForm.tsx`, etc.) vs `src/components/flow/` (newer 4-step wizard with `Step1Upload.tsx`, `Step2CheckItems.tsx`, `Step3AddPrices.tsx`, `Step4SendQuote.tsx`).
   - **Issue:** `src/app/page.tsx` renders the flow wizard, leaving components in `src/components/builder/` orphaned or unreferenced except in `SettingsPage`.

6. **Mobile Live Preview:**
   - **Location:** [src/components/preview/PreviewContainer.tsx#L42-L44](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/components/preview/PreviewContainer.tsx#L42-L44).
   - **Issue:** Mobile switches to `MobilePreview`, which is a card list rather than a scaled true A4 preview of what will actually print on the PDF.

---

## 3. Missing Features

1. **Dashboard & Quotation History Page (`/dashboard` or `/quotations`):**
   - Currently, navigating to `/` drops directly into the 4-step quotation builder.
   - There is no dashboard displaying recent quotations, draft vs sent quotes, search, or filters.
   
2. **Customer Reuse / Directory:**
   - No way to select a saved customer, leading to repetitive manual entry for recurring clients.

3. **Deterministic Digital PDF Parser:**
   - Digital PDFs are immediately converted to base64 and sent to Gemini, which incurs cost and fails if the user does not have an active Gemini key.

4. **Automated Test Suite:**
   - No Jest / Vitest / Playwright test harness configured in `package.json`. Only `next lint` and `tsc`.

---

## 4. Current Architecture & Data Flow

```
User (Browser)
 │
 ├── NextAuth Session (JWT in cookies, validated via proxy.ts)
 │
 ├── State Layer: React useReducer (quotationReducer) wrapped in QuotationProvider
 │    ├── LocalStorage (600ms debounce: quoteDraft, companyProfile, brandingProfile, defaultTerms)
 │    └── Cloud Sync (2000ms debounce: POST /api/quotation/save -> PostgreSQL "Quotation" table)
 │
 ├── RFQ Import:
 │    └── POST /api/ai/import-rfq -> ExcelJS (.xlsx -> tab text) -> Gemini 2.5 Flash -> mapImport -> Reducer
 │
 └── Export:
      ├── jsPDF / jspdf-autotable -> Client-side A4 PDF download
      └── WhatsApp Web / Universal Link -> Pre-filled quotation text
```

---

## 5. UX Problems Found in Actual Code

1. **Step Flow Fragmented Metadata Entry:**
   - Document metadata (vessel, quotation number, buyer company) is partially collected in Step 1, while attention and phone number are asked again in Step 4. Users cannot easily edit all document/customer details in one cohesive Step 1.
2. **Mobile Item Card Ergonomics in Step 2 & 3:**
   - In `Step2CheckItems.tsx`, a dense horizontal table is used for reviewing items, which forces horizontal scrolling on 360px-430px mobile screens.
3. **Silent Coercion of Extracted Data:**
   - When importing files without quantities, `mapImport.ts` sets `item.quantity = 1` and `item.unitPrice = 0` silently without distinguishing between "explicitly 0" and "missing data that must be reviewed".
4. **Lack of a Dashboard / Home View:**
   - User has no overview of their existing quotes or drafts when opening the application.

---

## 6. Security & Reliability Concerns

1. **`proxy.ts` Middleware Implementation:**
   - [src/proxy.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/proxy.ts) exports `proxy()`, but Next.js expects `middleware()` in `middleware.ts` or `src/middleware.ts`. Thus, route-level NextAuth proxying may NOT be executing on edge requests unless Next.js 16 specifically maps it. (Verified: Next.js App Router looks for `middleware.ts` or `src/middleware.ts`).
2. **Database Access Layer:**
   - [src/lib/prisma.ts](file:///c:/Users/alfaz/OneDrive/Desktop/MY_PROJECTS/Marine-Quataion%20generator/src/lib/prisma.ts) actually uses `pg.Pool` directly with parameterized raw SQL queries (`$1`, `$2`), while Prisma schema exists separately. Parameterized queries prevent SQL injection, but schema changes in `schema.prisma` are not automatically reflected in `src/lib/prisma.ts`.
3. **User Isolation in Quotation Save:**
   - `findQuotationByUserAndNumber` uses `userId` and `number`. Queries are safely scoped to the authenticated user ID.
4. **API Key Security:**
   - User Gemini API keys are queried only on server-side routes (`/api/ai/*`) from the database, never returned in plaintext to the frontend (masked with bullets in `/api/user/settings`).

---

## 7. Risks to Existing User Data

1. **Database Schema Stability:**
   - Existing database contains records in `"User"`, `"Quotation"`, and `"UserProfile"`. We must NOT drop tables or rename existing columns without backward compatibility.
2. **JSON Blob Fields:**
   - `"Quotation"` stores `items`, `company`, `client` as `Json`. Any schema migration or state refactor must cleanly handle legacy items where fields might be undefined or formatted under older naming conventions.

---

## 8. Recommended Implementation Sequence

1. **Fix Critical Build & Lint Blocker:**
   - Fix Next.js `middleware.ts` naming and ESLint issues in code.
2. **Phase 1 & 2: Navigation & Dashboard:**
   - Create coherent navigation for Desktop (Sidebar) and Mobile (Bottom Nav) with Dashboard (`/dashboard`), Builder (`/`), and Settings (`/settings`).
   - Add `/api/quotations` endpoint to fetch user's saved quotes and drafts from PostgreSQL, rendering them on the Dashboard with search and status badges.
3. **Phase 3 & 4: Quotation Builder & Mobile Redesign:**
   - Step 1: Document & Customer details (comprehensive form for vessel, PO ref, dates, client info, machine specs).
   - Step 2: RFQ Import & Items review with distinct mobile card view (>=44px touch targets, no horizontal table scroll) and desktop spreadsheet table.
   - Step 3: Pricing with batch editing, spreadsheet paste, and live totals.
   - Step 4: True A4 document preview (scaled for mobile viewport) and export/share actions.
4. **Phase 5: RFQ Import Cost Optimization & Zero Silent Guessing:**
   - Add deterministic Excel parser (`exceljs`) extracting structured rows directly without LLM when valid tabular structure exists.
   - Never convert missing quantities to 1 silently; flag them as `needs_review` and highlight missing values in review step.
5. **Phase 6 & 7: Customer Management & History Actions:**
   - Provide "Duplicate Quote", "New Quote", and customer autocomplete from previously saved quotation client data.
6. **Phase 8, 9, 10: PDF Multi-page Polish, Autosave & Validation:**
   - Verify multi-page layout, proper table pagination, wrap rules, and strict input validation.
7. **Phase 11 & 12: QA, Lint, Typecheck & Verification:**
   - Run typecheck, lint, build, and verify mobile responsiveness from 360px to desktop.
