📘 TECHNICAL DESIGN DOCUMENT (TDD)
Product: QuoteCraft V1
Version: 1.0
Architecture: Frontend Only
1️⃣ System Architecture Overview
🏗 Architecture Type

Client-Side Single Page Application (SPA)

User Browser
   ↓
Next.js App
   ↓
React State + LocalStorage
   ↓
PDF Generator (Client Side)

No backend.

All logic runs in browser.

2️⃣ Technology Stack
Framework

Next.js (App Router)

React 18

Styling

Tailwind CSS

ShadCN UI

Form Handling

React Hook Form

Zod (validation)

State Management

React useState / useReducer

Context API (optional for global state)

PDF Engine (Preferred)

@react-pdf/renderer

Alternative:

html2canvas + jsPDF

3️⃣ Application Structure
📂 Folder Structure
/app
   /page.tsx
/components
   /builder
      BrandingPanel.tsx
      DocumentInfoForm.tsx
      ClientSection.tsx
      ItemsTable.tsx
      SummarySection.tsx
      TermsSection.tsx
   /preview
      PreviewContainer.tsx
      templates/
         ClassicTemplate.tsx
         MinimalTemplate.tsx
         TechnicalTemplate.tsx
   /pdf
      PdfGenerator.tsx
/hooks
   useQuotationState.ts
/utils
   calculations.ts
   formatters.ts
/types
   quotation.types.ts
4️⃣ Core Data Model (Frontend Only)
QuotationState
interface QuotationState {
  branding: {
    logo: string | null
    primaryColor: string
    secondaryColor: string
    font: string
    layout: "classic" | "minimal" | "technical"
  }

  documentInfo: {
    type: "quotation" | "rfq" | "proforma"
    number: string
    date: string
    validUntil: string
    reference?: string
    project?: string
  }

  company: {
    name: string
    address: string
    phone: string
    email: string
    taxId?: string
  }

  client: {
    name: string
    companyName?: string
    address: string
    email?: string
    country?: string
  }

  items: LineItem[]

  summary: {
    discount: number
    tax: number
    shipping: number
  }

  terms: string
}
LineItem
interface LineItem {
  id: string
  itemName: string
  description?: string
  partNumber?: string
  quantity: number
  unit: string
  unitPrice: number
}

Totals calculated dynamically (not stored).

5️⃣ State Management Strategy

Use custom hook:

useQuotationState()

Responsibilities:

Store full quotation object

Handle item add/remove

Handle calculation updates

Sync with localStorage (optional)

6️⃣ Calculation Engine Design

All calculations inside:

/utils/calculations.ts

Functions:

calculateRowTotal(item)
calculateSubtotal(items)
calculateDiscount(subtotal, discount)
calculateTax(subtotal, tax)
calculateGrandTotal(...)

Rules:

rowTotal = quantity × unitPrice

subtotal = sum(rowTotal)

discountAmount =
  if percentage → subtotal × %
  if fixed → fixed amount

taxAmount = (subtotal - discount) × tax%

grandTotal =
  subtotal
  - discount
  + tax
  + shipping

All recalculated on every render.

No value stored permanently.

7️⃣ Component Architecture
🟦 7.1 Page Layout

Split screen:

-----------------------------------
|   Builder Panel  |  Preview    |
-----------------------------------

Mobile:

Tabs toggle (Builder / Preview)

🟦 7.2 Builder Panel Components
BrandingPanel

Handles:

Logo upload

Color pickers

Font dropdown

Layout selector

Updates:
quotation.branding

DocumentInfoForm

Handles:

Document type

Number

Dates

Reference

ClientSection

Handles:

Company info

Client info

ItemsTable

Handles:

Add row

Delete row

Update row

Auto row numbering

SummarySection

Handles:

Discount input

Tax input

Shipping input

Display totals

TermsSection

Textarea (rich optional)

8️⃣ Preview Rendering System
PreviewContainer.tsx

Based on selected layout:

switch(layout) {
  case "classic":
    return <ClassicTemplate data={quotation} />
}

Each template:

Pure presentation

No business logic

Uses calculated totals

9️⃣ Layout Template Design

Each template must define:

Header block

Company & Client block

Items table

Summary block

Terms block

Footer block

All templates share same data model.

Only visual difference.

🔟 PDF Generation Design
Flow

User clicks "Generate PDF"

Pass quotation state to PDF component

Render A4 layout

Trigger download

Option A (Recommended)

Use:

@react-pdf/renderer

Create:

PdfDocument.tsx

Separate layout for PDF to ensure print consistency.

Why:

Vector-based output

Better page break handling

Multi-page support

1️⃣1️⃣ Logo Handling

Accept PNG / JPG / SVG

Convert to base64

Store in state

Auto-scale width (max 150px)

Maintain aspect ratio

1️⃣2️⃣ Validation Strategy

Use Zod schema:

Quantity must be > 0

Unit price must be >= 0

At least 1 item required

Company name required

Client name required

Disable PDF button if invalid.

1️⃣3️⃣ Performance Considerations

Memoize calculated totals

Debounce heavy recalculations

Avoid re-rendering full preview on small change (optional optimization)

Expected:

< 2s PDF generation

< 100ms calculation updates

1️⃣4️⃣ UX Design Decisions

Collapsible builder sections

Sticky Generate PDF button

Live total highlight

Preview scroll independent from builder

Color preview on selection

1️⃣5️⃣ LocalStorage Strategy (Optional)

On every state change:

localStorage.setItem("quoteDraft", JSON.stringify(state))

On mount:

const saved = localStorage.getItem("quoteDraft")

This allows session persistence.

1️⃣6️⃣ Edge Case Handling
Scenario	Handling
No items	Disable PDF
Very long text	Text wrap
Many rows	Multi-page PDF
Large logo	Auto-scale
Invalid numbers	Inline error
1️⃣7️⃣ Security Considerations

Since no backend:

No sensitive storage

No API keys

All client-side only

Low security risk.

1️⃣8️⃣ Future Scalability Plan

Design state shape so it can later:

Be saved to database

Attach userId

Add documentId

Add version history

Avoid hardcoding layout logic.

Keep presentation separate from data logic.

1️⃣9️⃣ Deployment

Deploy on Vercel free plan

Static optimized build

No serverless functions required

Cost: ₹0

2️⃣0️⃣ Development Phases

Phase 1:

Base layout

State structure

Phase 2:

Items table + calculation engine

Phase 3:

Templates

Phase 4:

PDF generator

Phase 5:

Polish + UX improvements