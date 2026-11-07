# QuoteCraft Mobile Flow Redesign — Phase 0 Audit & Architecture Specification

> **Feature Flag:** `NEXT_PUBLIC_NEW_MOBILE_FLOW`  
> **Target Audience:** Marine Chandlers, Ship Suppliers, Industrial Equipment Exporters  
> **Device Reference:** Mid-range Android & iPhone smartphones (320px, 360px, 390px, 412px, 430px)  
> **Status:** Phase 0 (Read-Only Audit & Blueprint) — Awaiting User Approval before Phase 1 implementation.

---

## 1. Executive Summary & Hard Rules Adherence

### 1.1 The Operational Context
Marine chandlers and port suppliers operate in challenging conditions:
- **Environment:** Quay-side, ship engine rooms, port warehouses, moving launch boats.
- **Hardware:** Mid-range Android smartphones (Xiaomi Redmi, Samsung Galaxy A-series, Pixel) and standard iPhones (360px–390px viewport width).
- **Usage Profile:** One-handed thumb interaction, frequent interruptions (incoming WhatsApp calls, marine VHF), bright glare, variable 3G/4G connectivity.
- **Workflow:** Ingest messy RFQs (paper photos, PDF scans, Excel sheets, WhatsApp chat forwards) $\to$ quickly verify part numbers and quantities $\to$ enter unit prices $\to$ dispatch a professional, branded A4 quotation to the shipowner or superintendent via WhatsApp in under 3 minutes.

### 1.2 Hard Rules Compliance
1. **UI/UX Only:** No modifications to calculations, backend APIs, Prisma database models, or commercial rules.
2. **Feature Preservation:** 100% feature parity preserved (autosave, undo history, Jump to check, filter chips, Excel column paste, WhatsApp share, multi-template selector, column toggles, vector PDF live preview, TBA line items). Everything is cleanly organized into progressive disclosure sheets—nothing is removed.
3. **Strict Feature Gating:** All new mobile architecture resides behind `process.env.NEXT_PUBLIC_NEW_MOBILE_FLOW === "true"`. When the flag is disabled, the existing desktop/hybrid application behaves identically with zero regression.
4. **Zero Unjustified Dependencies:** Built natively using existing Next.js 16, React 19, Tailwind CSS, Lucide icons, and existing PDF generator.

---

## 2. Screen-to-Component Mapping

| Existing Component | File Path | Existing Mobile Responsibilities | Target Redesign Architecture (`NEXT_PUBLIC_NEW_MOBILE_FLOW`) |
| :--- | :--- | :--- | :--- |
| **Header Toolbar** | `src/app/page.tsx` (L238–L331) | App brand, quote #, undo, autosave status, company profile, grand total, new quote | **`AppBar` (56px sticky):** Back arrow, quote # + dynamic "Saved just now" status, and a single `...` Overflow Menu containing (Reset draft, New quote, Company profile, Dashboard). Integrated 4px 3-segment progress indicator on the bottom edge. |
| **Step Navigation** | `src/components/flow/StepNavigation.tsx` (L1–L101) | 3 pill tabs ("1. Upload", "2. Review", "3. Pricing") with badge counts | **Embedded into `AppBar` & Screen Titles:** Removed standalone bulky stepper. Replaced with 4px progress bar on AppBar + clean screen title: `"Step X of 3" (13px)`, title `(22px/600)`, helper `(14px)`. |
| **Step 1 (Add Request)** | `src/components/flow/Step1Upload.tsx` (L1–L521) | Dual-mode switcher (File vs Paste), curved teal banner, dropzone, metadata accordion, staged processing | **`Step1AddRequestMobile`:** 3 stacked 64px tap cards: `[Choose File]`, `[Take Photo]` (`capture="environment"`), `[Paste Text]`. Secondary shortcuts: "Try with sample marine RFQ" and "Start with blank quote". Staged progress bar with live step text and cancel link. |
| **Step 2 (Check Items)** | `src/components/flow/Step2CheckItems.tsx` (L1–L1076) | Scraped RFQ card, review banner, filter chips, table/card items, duplicated currency/discount/tax/shipping controls, 2 continue buttons | **`Step2CheckItemsMobile`:** 40px top summary strip (`14 items found | 3 need check` + `[Jump to first]`), filter pills (`All`, `Needs check`, `OK`), native item cards with inline editable name, stepper qty `[-] [input] [+]`, unit dropdown, and amber question prompt with 1-tap fixes. Zero financial inputs on this step. |
| **Step 3 (Price & Send)** | `src/components/flow/Step3AddPricesAndSend.tsx` (L1–L878) | Pricing table, adjustments card, PDF preview, WhatsApp share, 5 send/download buttons, delete draft | **`Step3PriceAndSendMobile`:** 3-tab segmented control (`Prices` \| `Details & terms` \| `Preview`). Large numeric inputs (`inputmode="decimal"`), TBA line item toggle, unified commercial terms, fit-to-width live PDF preview, and a pre-send validation BottomSheet preventing $0 unpriced dispatches. |
| **Bottom Navigation / Actions** | Multiple footers across Step 2 & Step 3 | Fixed/sticky footers with overlapping buttons and red trash icons | **`BottomBar`:** Sticky in normal document flow (never floating over content), `pb-[max(1rem,env(safe-area-inset-bottom))]`, exactly one 48px primary action + at most one secondary action in the exact same thumb zone across all 3 steps. |

---

## 3. Comprehensive Issue Catalog (Verification & Target Fixes)

Each issue from the audit has been assigned a permanent tracking ID:

### Layout Issues
- **`ISSUE-01` [Overcrowded / Overlapping Header]:**
  - *Location:* `src/app/page.tsx` (L238–L331).
  - *Symptom:* On 320px–360px devices, QuoteCraft logo, quote number badge, autosave pill, undo button, company profile button, and new quote button wrap onto multiple lines or overflow horizontally.
  - *Fix:* Replace toolbar with 56px fixed `AppBar`. Move Undo, Company Profile, New Quote, and Reset into a single `...` Overflow Dropdown/BottomSheet.
- **`ISSUE-02` [Truncated Stepper Labels]:**
  - *Location:* `src/components/flow/StepNavigation.tsx` (L61–L93).
  - *Symptom:* Stepper text "1. Upload", "2. Review", "3. Pricing & Preview" truncates on 360px screens with ellipses ("3. Prici...").
  - *Fix:* Remove redundant stepper component on mobile. Stepper is replaced by a 4px 3-segment progress indicator on the AppBar edge and clean header text: "Step 2 of 3".
- **`ISSUE-03` [Clipped "Continue to Pricing" Button]:**
  - *Location:* `src/components/flow/Step2CheckItems.tsx` (L324–L329).
  - *Symptom:* The top header action row contains "Clear & Re-upload", "Columns", "Add Row", and "Continue to Pricing", forcing the continue button off-screen to the right.
  - *Fix:* Remove top continue button entirely. Keep a single, guaranteed `BottomBar` continue button.
- **`ISSUE-04` [Ctrl+V Chip Overlapping Text]:**
  - *Location:* `src/components/flow/Step2CheckItems.tsx` and `Step3AddPricesAndSend.tsx`.
  - *Symptom:* Desktop keyboard shortcut hints ("Press Ctrl+V to paste") overlap input labels on mobile viewports.
  - *Fix:* Hide all keyboard shortcut badges on mobile (`hidden sm:inline-flex`).
- **`ISSUE-05` [Titles Wrapping Beside Wrapped Back Link]:**
  - *Location:* `Step2CheckItems.tsx` (L254–L277) and `Step3AddPricesAndSend.tsx` (L266–L282).
  - *Symptom:* Back button and screen heading are flexed side-by-side, causing headings to wrap into 3 awkward lines on narrow viewports.
  - *Fix:* Back arrow is moved permanently to the left of the sticky 56px `AppBar`. Headings have full screen width.
- **`ISSUE-06` [Pluralization Grammar Errors]:**
  - *Location:* `src/components/flow/Step2CheckItems.tsx` (L270, L373).
  - *Symptom:* Renders "1 items", "0 items".
  - *Fix:* Standardize pluralization helper: `${count} item${count === 1 ? "" : "s"}`.

### Space & Density Issues
- **`ISSUE-07` [Excessive Sticky Chrome]:**
  - *Location:* `src/app/page.tsx` + `StepNavigation.tsx` + Step banners.
  - *Symptom:* Top app header (54px) + StepNavigation (58px) + Teal STEP banner (88px) = 200px of vertical space (~24% of an 844px screen) before user sees any content.
  - *Fix:* Eliminate the 88px STEP banner and standalone 58px stepper. A single 56px AppBar with 4px progress line saves over 140px of vertical viewport!
- **`ISSUE-08` ["Upload RFQ" Shown 3 Times]:**
  - *Location:* `Step1Upload.tsx` (L251, L272, L304).
  - *Symptom:* The text "Upload RFQ" appears in page title, tab button, and inside the curved teal banner simultaneously.
  - *Fix:* Single title: "Add Request" with helper sentence "Upload a file, take a photo, or paste enquiry text."
- **`ISSUE-09` [First Step 2 Item at ~77% Scroll]:**
  - *Location:* `Step2CheckItems.tsx` (L227–L450).
  - *Symptom:* Teal banner + header actions + RFQ scraped card + review alert + search bar pushes line item #1 below the 75% screen fold.
  - *Fix:* Compact 40px summary strip directly into filter chips and search bar. Item #1 appears above the 35% fold.
- **`ISSUE-10` [Step 3 Preview Starts at ~92% Scroll]:**
  - *Location:* `Step3AddPricesAndSend.tsx` (L239–L670).
  - *Symptom:* Mobile user has to scroll past banner, metadata drawer, pricing table, and adjustments card to find the PDF preview.
  - *Fix:* 3-segment top controller: `[Prices]` | `[Details & terms]` | `[Preview]`. Switching to `Preview` renders full-width PDF immediately.

### Flow & Ergonomics Issues
- **`ISSUE-11` [Inconsistent Step Names Across Paths]:**
  - *Location:* Inconsistent labels between Stepper ("1. Upload", "2. Review", "3. Pricing") and inner banners ("Upload RFQ", "Review Extracted Items", "Quotation Details").
  - *Fix:* Uniform step naming across blank, upload, and resume flows:
    1. **Add request** $\to$ 2. **Check items** $\to$ 3. **Price and send**
- **`ISSUE-12` [Premature Commercial Controls Duplicated in Step 2]:**
  - *Location:* `Step2CheckItems.tsx` (L810–L895).
  - *Symptom:* Currency, Discount, Tax %, and Shipping inputs appear in Step 2 before the user has even priced line items.
  - *Fix:* Strip all commercial currency/tax/discount/shipping controls from Step 2. Keep Step 2 focused 100% on verifying item names, quantities, and units.
- **`ISSUE-13` [Premature Grand Total Displayed in Step 2]:**
  - *Location:* `Step2CheckItems.tsx` (L900–L926).
  - *Symptom:* Displays "Grand Total: $0.00" or partial total in Step 2, creating confusion for users who haven't priced items yet.
  - *Fix:* Replace financial total in Step 2 with item verification progress: `"14 items • All verified"`.
- **`ISSUE-14` [Customer and Vessel Scattered in 3 Places]:**
  - *Location:* Metadata edited in Step 1 accordion, Step 2 drawer, and Step 3 drawer.
  - *Fix:* Centralize Customer & Vessel fields cleanly into Step 3's `[Details & terms]` tab, with optional quick-view pill in Step 2.
- **`ISSUE-15` [False Positive "All 0 Items Verified" Alert]:**
  - *Location:* `Step2CheckItems.tsx` (L389).
  - *Symptom:* When items array is empty, it displays a green checkmark saying "All 0 items verified and ready".
  - *Fix:* Only display verification success when `items.length > 0 && reviewCount === 0`. If 0 items, display empty prompt with "+ Add Item".
- **`ISSUE-16` [Stray Desktop "1 Items Selected" Bar]:**
  - *Location:* Remnant of desktop multi-select table.
  - *Fix:* Suppress batch selection floating overlay on mobile viewports.
- **`ISSUE-17` [Desktop Copy on Mobile]:**
  - *Location:* "Drag & drop your file here", "Click to upload", "Press Enter to save".
  - *Fix:* Mobile-native copy: "Tap to choose file", "Take photo with camera", "Tap to edit".
- **`ISSUE-18` [Ambiguous "LAUNCH / SHIPPING CHARGE"]:**
  - *Location:* `Step2CheckItems.tsx` (L883), `Step3AddPricesAndSend.tsx` (L641).
  - *Symptom:* International shipowners don't always understand "Launch Charge".
  - *Fix:* Clear label: **"Delivery charge"** with subtitle *"Boat delivery to anchorage / road freight"*.
- **`ISSUE-19` [Unsafe Sending with $0, TBA, or Placeholder Name]:**
  - *Location:* `Step3AddPricesAndSend.tsx` (L163–L166).
  - *Symptom:* Tapping "Download" or "Send WhatsApp" allows sending quotes with $0 items or default "QuoteCraft" company name with only a transient toast.
  - *Fix:* Introduce **Pre-Send Validation BottomSheet**. Intercepts dispatch if items have $0 price, TBA items exist, or customer name is blank, providing one-tap "Fix" links and an explicit "Send anyway" option.

### Actions & Touch Ergonomics Issues
- **`ISSUE-20` [Two Competing Continue Buttons in Step 2]:**
  - *Location:* `Step2CheckItems.tsx` (L327) and (L941).
  - *Fix:* Single `BottomBar` primary action: `"Continue to Pricing ->"`.
- **`ISSUE-21` [Competing Action Colors]:**
  - *Location:* Gold button vs Teal button vs Green WhatsApp button competing for visual hierarchy.
  - *Fix:* Strict color token hierarchy: Primary CTA is always Deep Teal (`#0F766E`), WhatsApp action is Forest Green (`#16A34A`), Warning is Amber (`#F59E0B`), and Destructive actions are tucked inside sheets/menus.
- **`ISSUE-22` [Five Send/Download Buttons in Step 3 & Adjacent Red Trash]:**
  - *Location:* `Step3AddPricesAndSend.tsx` (L677, L695, L704, L751, L770, L782).
  - *Symptom:* Download in card (teal), Download in footer (amber), WhatsApp in card, WhatsApp in footer, Copy Summary, and red trash directly touching the share button.
  - *Fix:* Consolidated into one primary `BottomBar` button: `"Send quotation"` (opens Pre-Send Sheet with WhatsApp, Link copy, PDF download) + secondary `"Download PDF"`. Red trash moved safely into the AppBar `...` overflow menu with a confirmation dialog.
- **`ISSUE-23` [Three Unlabeled Header Icons on Mobile]:**
  - *Location:* `src/app/page.tsx` (L290, L303, L323).
  - *Fix:* Move into labelled list inside `...` overflow menu: "Reset draft", "Start new quote", "Company profile", "Exit to dashboard".
- **`ISSUE-24` [Monospace Font Overuse & Too Many Border Colors]:**
  - *Location:* Across cards and table headers.
  - *Fix:* Limit monospace font strictly to tabular currency numbers and part codes. Use Manrope sans-serif for descriptions, labels, and helper copy. Standardize borders to `border-slate-200`.

---

## 4. Low-Fidelity Wireframes & Layout Geometry

### 4.1 Shared Mobile Shell
```
┌────────────────────────────────────────────────────────┐
│ [←]  QT-2026-001  •  Saved just now              [···] │ 56px sticky AppBar
├────────────────────────────────────────────────────────┤
│ [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │ 4px progress bar (Step 2/3)
│                                                        │
│ Step 2 of 3                                            │ 13px muted slate
│ Check items                                            │ 22px / font-weight: 600
│ Verify extracted descriptions and quantities.          │ 14px helper
│                                                        │
│  [ SCROLLING CONTENT AREA (flex-1, 100dvh safe) ]      │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [            Continue to Pricing →                   ] │ 48px primary button
└────────────────────────────────────────────────────────┘ Sticky BottomBar in doc flow
```

### 4.2 Step 1: Add Request Wireframe
```
┌────────────────────────────────────────────────────────┐
│ Step 1 of 3                                            │
│ Add request                                            │
│ How would you like to add your customer's enquiry?     │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [📁]  Choose file                                  │ │ 64px row
│ │       PDF, Excel, Word, or scanned document       │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [📷]  Take photo                                   │ │ 64px row (direct camera)
│ │       Snap photo of paper RFQ or printed order     │ │ capture="environment"
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [📋]  Paste text                                   │ │ 64px row
│ │       From WhatsApp message, email, or chat        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│  ─── OR ───                                            │
│                                                        │
│  🔗 Try with a sample marine RFQ                       │ Quick test shortcut
│  🔗 Start with a blank quote                           │ Direct manual entry
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🕒 Continue recent draft: QT-9402 (12 items)       │ │ Resume strip (if exists)
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

#### Uploading / AI Staged Progress State
```
┌────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📄 RFQ_Oceanic_Engines.pdf                 (2.4 MB)│ │ File info
│ │                                                    │ │
│ │ Reading file → Finding items → Checking details    │ │ Staged step copy
│ │ [████████████████████░░░░░░░░░░░░░░░] 68%          │ │ Smooth animated progress
│ │ Elapsed: 4s                                        │ │ Live timer
│ │                                                    │ │
│ │ ✕ Cancel                                           │ │ Safe abort link
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 4.3 Step 2: Check Items Wireframe
```
┌────────────────────────────────────────────────────────┐
│ [ 14 items found  |  3 need check ]   [Jump to check]  │ 40px summary strip
├────────────────────────────────────────────────────────┤
│ ( All 14 )   ( ⚠️ Needs check 3 )   ( ✓ OK 11 )        │ Filter chips
│ [ 🔍 Search items or part numbers...                 ] │ Search bar
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 1. Main Engine Piston Ring                 [CHECK] │ Amber badge
│ │ Part No: MAN-B&W-6S60MC                            │
│ │ Description: Cylinder liner ring pack (more...)    │
│ │                                                    │
│ │ Qty: [-] [ 12 ] [+]   Unit: [ PCS ▼ ]              │ Stepper + dropdown
│ │                                                    │
│ │ ⚠️ Unit missing in RFQ — assume PCS?               │ Flag question box
│ │ [ Accept PCS ]  [ Type Unit ]  [ 🗑 Delete ]        │ 1-tap fast resolution
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 2. Fuel Oil Injector Nozzle                   [OK] │ Green badge
│ │ Part No: NOZ-8821-X                                │
│ │ Qty: [-] [ 6 ] [+]    Unit: [ SET ▼ ]              │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│  [ + Add item ]          [ 📋 Paste from Excel ]       │ Floating / in-flow
├────────────────────────────────────────────────────────┤
│ [            Continue to Pricing →                   ] │ 48px Primary CTA
└────────────────────────────────────────────────────────┘
```

### 4.4 Step 3: Price and Send Wireframe
```
┌────────────────────────────────────────────────────────┐
│ [  Prices  ]    [  Details & terms  ]    [  Preview  ] │ 3-segment switcher
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │ (PRICES TAB)
│ │ 1. Main Engine Piston Ring                         │ │
│ │ 12 PCS  •  Line Total: $ 2,160.00                  │ │
│ │                                                    │ │
│ │ Unit Price: [ $  180.00 ]          [ ] TBA         │ 16px decimal input
│ └────────────────────────────────────────────────────┘ │ TBA checkbox
│ ┌────────────────────────────────────────────────────┐ │
│ │ 2. Fuel Oil Injector Nozzle                        │ │
│ │ 6 SET  •  Line Total: $ 1,500.00                   │ │
│ │ Unit Price: [ $  250.00 ]          [ ] TBA         │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Subtotal: $ 3,660.00  •  Delivery: $ 150.00        │ │ Sticky Subtotal Strip
│ │ Grand Total: $ 3,810.00                            │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ [ Download PDF ]            [   Send quotation →     ] │ Secondary + Primary
└────────────────────────────────────────────────────────┘
```

#### Pre-Send Validation BottomSheet
```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Check Before Sending                                │
│ We found 2 things that might need your attention:      │
│                                                        │
│ • Item #3 "Emergency Bilge Gasket" has $0 price        │
│   [ Fix Price ]                                        │
│                                                        │
│ • Customer Name is not set                             │
│   [ Add Customer ]                                     │
│                                                        │
│ ────────────────────────────────────────────────────── │
│ [ Fix items first ]            [ Send quotation anyway ]
└────────────────────────────────────────────────────────┘
```

#### Share Dispatch BottomSheet (When Validated)
```
┌────────────────────────────────────────────────────────┐
│ Send Quotation QT-2026-001                             │
│ Grand Total: $ 3,810.00 (14 items)                     │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 💬 Share via WhatsApp                              │ │ 52px Forest Green CTA
│ │    Opens WhatsApp with formatted quote message     │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📥 Download Branded PDF Quotation                  │ │ 48px Secondary CTA
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🔗 Copy Quotation Summary Link                     │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ✓ Mark as Sent                                     │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 5. Viewport Breakpoint Audit Matrix

| Viewport | Device Representation | Potential Pitfall Observed | Redesign Guarantee |
| :--- | :--- | :--- | :--- |
| **320 × 568 pt** | iPhone SE (1st gen) | Stepper truncated, buttons wrap, horizontal scroll | Single 56px AppBar, 1-column cards, flex-wrap disabled on bottom bar |
| **360 × 800 pt** | Samsung Galaxy A-series, Xiaomi Redmi | Header icons cramped, 200px chrome fold | `max-w-[480px]` centered, 56px AppBar + 4px bar, content starts at 120px |
| **390 × 844 pt** | iPhone 12 / 13 / 14 / 15 | Native iOS auto-zoom on inputs $<16$px | All `<input>` and `<select>` set to `text-[16px]` |
| **412 × 915 pt** | Google Pixel 7, Galaxy S21+ | Android bottom system bar covers primary CTA | `pb-[max(1rem,env(safe-area-inset-bottom))]` |
| **430 × 932 pt** | iPhone 14 / 15 Pro Max | Floating sheet width excessive | Constrained to `max-w-md mx-auto` |

---

## 6. Design System Tokens Alignment

Tokens mapped directly from user brand specifications and reference boards:

```css
/* Color Palette */
--color-primary-teal: #0F766E;     /* Deep Teal: Primary CTAs, active highlights */
--color-primary-dark: #0D6B63;     /* Hover & active states */
--color-gold-accent:  #F59E0B;     /* Amber / Gold: Highlights, warnings */
--color-cream-bg:     #FFFBEB;     /* Warm cream accent background */
--color-slate-body:   #475569;     /* Secondary text, labels */
--color-slate-title:  #0F172A;     /* Primary headings */
--color-teal-light:   #E0F2F1;     /* Light teal banner/pill background */
--color-green-success:#16A34A;     /* Verified badges, WhatsApp CTA */
--color-rose-danger:  #DC2626;     /* Destructive actions in menus */
--color-surface-bg:   #FAF9F5;     /* Neutral background canvas */
--color-card-bg:      #FFFFFF;     /* Card background */
--color-border-subtle:#E2E8F0;     /* Consistent card & input borders */

/* Typography & Ergonomics */
--font-brand:         'Manrope', system-ui, sans-serif;
--touch-target-min:   44px;
--primary-cta-height: 48px;
--input-font-size:    16px;        /* Strict iOS auto-zoom prevention */
--z-index-base:       0;
--z-index-dropdown:   10;
--z-index-sticky:     20;
--z-index-appbar:     30;
--z-index-bottombar:  30;
--z-index-sheet:      40;
--z-index-modal:      50;
```

---

## 7. "Backend Asks" List (Boundary Separation)

The redesign is strictly front-end UI/UX. The following non-blocking backend improvements are documented for future sprints:
1. **Pre-Signed Direct Upload URL (`/api/upload/presign`):** Currently, file uploads pass base64 payloads to `/api/ai/import-rfq`. For camera photos $>5\text{MB}$, browser-side canvas downsampling to $<1.5\text{MB}$ will be applied in Phase 2 client-side. A direct S3/R2 upload endpoint would further optimize memory on low-RAM devices.
2. **Server-Side Quotation Share Token (`/api/quotations/:id/share`):** The "Copy Link" action currently copies a formatted text summary. A lightweight public read-only link endpoint would enable clients to view the web PDF directly.
3. **WhatsApp Business API Webhook:** For automated status tracking when an RFQ is accepted via WhatsApp.

---

## 8. Rollout Plan & Next Steps

1. **Phase 0 (Current):** Read-only Audit, Issue Verification, Low-Fidelity Wireframes, and Architecture Spec $\to$ **STOP AND AWAIT USER APPROVAL**.
2. **Phase 1 (Upon Approval):** Git branch `feature/mobile-flow-redesign`. Implement tokens, `NewMobileShell`, `AppBar`, `BottomBar`, `BottomSheet`, and `SaveStatus`.
3. **Phase 2:** Implement Step 1, Step 2, and Step 3 behind `NEXT_PUBLIC_NEW_MOBILE_FLOW`.
4. **Phase 3:** States, error toasts, copy polishing, accessibility, keyboard focus management.
5. **Phase 4:** End-to-end verification across viewports, scorecards, and rollout checklist.

