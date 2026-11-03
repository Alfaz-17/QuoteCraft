# QuoteCraft UX & Architecture Specification

## 1. Information Architecture & Navigation

QuoteCraft is designed for marine and industrial spare parts traders who create quotes from laptops in the office and mobile phones while visiting vessels, ports, or warehouses.

### Primary Navigation
- **Dashboard (`/dashboard`):** Real-time overview of active quotations, drafts, quick actions (Create Quote, Import RFQ), and search/filtering across past transactions.
- **RFQ / Quote Builder (`/` or `/builder`):** The focused 4-step creation engine.
- **Quotation History (`/quotations`):** Dedicated searchable, filterable archive of all user quotations with actions (Edit, Duplicate, Download PDF, Share).
- **Settings (`/settings`):** Business profile, company logo, color palette, default terms, and Gemini API key management.

### Desktop Layout
- **Sidebar (Left, 240px):**
  - Brand logo and application title.
  - Primary navigation links with active state indicator.
  - User session card with name, email, and sign-out button.
- **Header:**
  - Active document number and status badge (Draft / Synced).
  - Quick action controls (Undo, Company Profile shortcut, Live Grand Total pill).
- **Workspace:** Max-width container (`max-w-6xl`) with high-contrast, clean typography (Inter / Geist).

### Mobile Layout (< 768px)
- **Top Header:** Compact bar with logo, quote number, and autosave status indicator.
- **Content Area:** Single-column stacked cards. All touch targets $\ge 44\text{px}$. Zero forced horizontal scrolling for reviewing and pricing items.
- **Bottom Navigation Bar:** Fixed to the bottom viewport with safe-area padding (`env(safe-area-inset-bottom)`). Provides one-tap switching between Dashboard, Builder, Quotations, and Settings.

---

## 2. 4-Step Quotation Workflow Spec

### STEP 1: Document & Customer Details
- **Document Type:** Segmented toggle: Quotation, Request for Quotation (RFQ), Proforma Invoice.
- **Document Metadata:** Quotation number (auto-sequenced e.g. `QT-1001`), Issue Date (default: today), Valid Until (default: +30 days).
- **Maritime Specifications:** Vessel Name, Inquiry / PO Reference Number.
- **Equipment Specifications (Collapsible):** Machinery Scope, Engine Make, Engine Model.
- **Customer / Buyer Profile:**
  - Company name with autocomplete from past saved quotations.
  - Contact person (Attention / Attn).
  - WhatsApp phone number (with country code validation).
  - Delivery address / port of supply.
- Non-blocking: users can proceed with partial info; drafts save automatically.

### STEP 2: RFQ Import & Item Review
- **Import Methods:**
  - Drag-and-drop Excel (`.xlsx`, `.xls`, `.csv`).
  - Digital PDF or scanned document image (`.pdf`, `.png`, `.jpg`).
  - Direct paste of WhatsApp or email text.
  - "Start Blank" manual button.
- **Extraction Review Interface:**
  - Highlighting for items needing user attention: missing quantities, unrecognized units, or blank descriptions.
  - Explicit distinction between verified rows and flagged rows.
  - Ability to add, edit, duplicate, delete, and reorder items.
  - Column manager: customize, show/hide, or add custom technical columns (e.g. Drawing No, Position No, IMPA code).
- **Mobile Item Cards:**
  - Clean card displaying Item Title, Part No, Quantity, Unit, Condition, and Action menu (Edit, Duplicate, Delete).

### STEP 3: Commercial Pricing & Totals
- **Currency Selector:** Global currency choice (`USD`, `EUR`, `AED`, `INR`, `GBP`, `SGD`, `JPY`).
- **Spreadsheet Ergonomics (Desktop):**
  - Fast keyboard entry: <kbd>Enter</kbd> or <kbd>Down Arrow</kbd> advances to next row.
  - Column paste: paste a list of prices copied directly from Excel.
- **Mobile Pricing:** Large numerical keypad-friendly inputs with instant row-total recalculation.
- **Commercial Adjustments Dock:**
  - Discount: flat amount or percentage.
  - Tax / VAT: customizable percentage.
  - Shipping & handling charges.
  - Floating Grand Total summary.

### STEP 4: Live Preview & Export
- **True A4 Preview:** High-fidelity document rendering reflecting the exact page-break and tabular layout of the output PDF.
  - Desktop: Standard A4 view.
  - Mobile: Fluid viewport-scaled A4 preview with zoom toggle, eliminating discrepancies between preview and PDF.
- **Export Actions:**
  - **Download PDF:** Multi-page vector PDF generated via `jsPDF` + `jspdf-autotable`.
  - **Share on WhatsApp:** Instant pre-formatted message sent via WhatsApp Web or native app.
  - **Start New Quote:** Cleans draft while preserving company profile and sequence.
