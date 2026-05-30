📘 PRODUCT REQUIREMENTS DOCUMENT (PRD)

Product Name: QuoteCraft – B2B SaaS Quotation & RFQ Intelligence Builder

---

## 1️⃣ Product Overview

QuoteCraft is a premium, cloud-synced, browser-based B2B SaaS application designed for marine suppliers, ship chandlers, and heavy equipment traders. It allows active trading agents to generate beautifully branded, multi-currency quotations, RFQs, and proforma invoices with a high-fidelity live preview and professional downloadable A4 PDFs. 

It is now a full commercial application incorporating secure multi-user authentication, resilient cloud storage, background auto-syncing, and advanced multimodal AI document parsing.

---

## 2️⃣ Core Architectural Foundations (Live V2)

Unlike the initial offline-only MVP, the current system is a production-ready B2B SaaS powered by:
1. **🔐 Multi-User Authentication (NextAuth):** Secure email/credentials-based signup and login system using `bcryptjs` password hashing and robust JWT B2B cloud sessions.
2. **🗄️ Resilient Cloud Database (Neon PostgreSQL & Prisma 7):** Centralized cloud storage using Prisma Client (singleton export pattern) connected to a scalable Neon database cluster.
3. **🔄 Real-Time Background Cloud Sync:** Debounced autosaving (1.5s inactivity delay) that automatically syncs the active document structure to PostgreSQL without blocking frontend typing performance.
4. **🤖 AI RFQ Importer (Gemini 2.5 Flash):** An advanced multimodal uploader modal allowing users to drag and drop PDFs, Excel files, invoices, or paste raw text to instantly extract and populate line items.
5. **⚙️ Custom B2B Integrations:** Allows agents to save and synchronize their own custom Gemini API keys inside settings.

---

## 3️⃣ Target Users & Geography

* **Primary Users:** Marine spare parts suppliers, technical ship chandlers, mechanical equipment traders, and global import/export agencies.
* **Secondary Users:** Industrial distributors, engineering service providers, and freelance technical estimators.
* **Primary Geographies:** SME trading hubs in India, UAE (Dubai/Abu Dhabi), Singapore, and the global maritime commerce sector.

---

## 4️⃣ Core Features (Completed & Live)

### 🔹 4.1 Branding Customization Settings
* **Branding Profiles:** Persists company logo, custom primary/secondary palettes, standard body text colors, and font configurations in browser local storage.
* **Streamlined settings panel:** Centrally configures company visual identities.
* **Live Sync:** Reflects branding updates instantly on the live preview and output PDFs.

### 🔹 4.2 Document Details
* **Document Types:** Quick switching between **Quotation**, **RFQ**, and **Proforma Invoice** formats.
* **Sequence Numbers:** Trackable document numbers that automatically increment sequence counters (e.g. `QT-1001` → `QT-1002`) on new creations.
* **Maritime Details:** Integrated fields for **Vessel Name** and **Reference Numbers** (PO or Inquiry references).
* **Technical Details:** Specialized fields for **Scope of Supply**, **Machine Make**, and **Machine Model** (collapsible via Settings).

### 🔹 4.3 Company & Client Section
* **Business Profile (Your Details):** Set once globally in Settings. Hidden from the active builder tab to prevent redundant double data-entry while still automatically printing on the PDF output.
* **Customer Details (Client Details):** Input panel on the main builder to specify the client contact person, attention (Attn), client company name, and address.

### 🔹 4.4 Dynamic Parts Table & Controls
* **Line Item Columns:** S.No (auto-generated), Item Name, Description, Part Number, Qty, Unit, Condition, Rate, and Row Total.
* **Premium Table Controls:**
  * **Duplication:** One-click duplicate for line items.
  * **Reordering:** Arrow buttons to reorder item listings.
  * **Unit Selector:** Quick-insert dropdown (pcs, sets, kg, ltrs, mtrs, nos, lot).
* **AI RFQ Importer Modal:** Drag-and-drop file uploader supporting Base64 PDF, image, or raw text analysis to instantly generate parts tables. Supports "Append to Table" or "Replace Current Rows".

### 🔹 4.5 Multi-Currency & Pricing Calculations
* **Global Currency Formatter:** Supports `USD`, `EUR`, `GBP`, `AED`, `INR`, `SGD`, and `JPY` with automatic symbol formatting on subtotals, charges, and PDFs.
* **Commercial Charges:** Supports flat or percentage-based discounts, tax/VAT rates, and shipping fees.
* **Calculations:** 
  * `Row Total` = Qty × Unit Price
  * `Subtotal` = Sum of all rows
  * `Grand Total` = (Subtotal - Discount) + Tax + Shipping

### 🔹 4.6 Default Terms & Conditions
* **Zero Double Entry:** Standard terms configured in Settings are cached globally and automatically pre-filled on every "New Quotation" without requiring retyping.
* **Customization:** Active document terms can still be edited or refined in the builder tab without overwriting your global settings.
* **Terms Templates:** One-click buttons to quick-insert typical marine trading terms (Payment T/T, Letter of Credit, 30-Day Credit, Ex-Works, FOB, CIF, Warranty, Sea-Worthy Packing).

---

## 5️⃣ Technical Architecture (V2 SaaS)

```mermaid
graph TD
  User((Trading Agent)) -->|Interacts| Frontend[Next.js App Router & Tailwind CSS]
  Frontend -->|Client Session| NextAuth[NextAuth JWT Handler]
  Frontend -->|Local Caching| LocalStorage[(Browser LocalStorage)]
  Frontend -->|Debounced Sync| API_Save[API Route: /api/quotation/save]
  Frontend -->|AI Document Parse| API_AI[API Route: /api/ai/import-rfq]
  
  API_Save -->|Prisma Client| Prisma[Prisma Client Singleton]
  API_AI -->|Gemini SDK| Gemini[Gemini-2.5-Flash Model]
  
  Prisma -->|PostgreSQL Protocol| DB[(Neon PostgreSQL DB Cloud)]
  DB -->|Saves Accounts/Quotes| DB
```

### Dependency Stack:
* **Core:** Next.js (App Router, Turbopack compiler) & React 19.
* **Database & ORM:** Prisma 7 & `@prisma/client` connected to Neon.
* **Authentication:** `next-auth` (session tokens, secure credentials check).
* **AI Engine:** `@google/generative-ai` SDK (`gemini-2.5-flash` model).
* **PDF Engine:** `@react-pdf/renderer` & `jspdf` (for absolute vector layouts).

---

## 6️⃣ B2B SaaS Pricing & Monetization Model

QuoteCraft implements a tiered software subscription to lock advanced features behind B2B paywalls:

1. **Starter (Free Tier):** Limit of 5 manual quotation PDF downloads/month. Data saved locally in the browser only.
2. **Professional ($29/mo):** Unlimited quotes, custom branding profiles, and saved default terms.
3. **Business ($79/mo):** Access to private Client Web Portal links, **"Read/Opened" tracking notifications**, and integrated Stripe checks.
4. **Enterprise ($199+/mo):** Multi-agent team workspaces, shared templates, live IMO/Maritime Vessel Finder database lookups, and unlimited AI RFQ imports.