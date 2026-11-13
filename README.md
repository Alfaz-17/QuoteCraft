# QuoteCraft — Marine Quotation Generator

> **Turn messy buyer RFQs into client-ready, branded marine quotations in seconds.**  
> Built for ship chandlers, maritime technical suppliers, bunker traders, and offshore procurement teams.

---

## ⚓ What is QuoteCraft?

In maritime supply and ship chandlery, buyers send requisitions (RFQs) in all formats: multi-sheet Excel files, scanned PDFs, equipment photographs, or raw emails. Re-typing hundreds of lines with IMPA/ISSA codes, part numbers, and quantities into a quote is the single biggest bottleneck for suppliers.

**QuoteCraft automates this entire front-office workflow:**
1. **Intelligent RFQ Ingestion:** Deterministic parsing for Excel spreadsheets, coordinate-aware extraction for searchable PDFs, and Groq AI (`qwen/qwen3.8-27b` & `llama-3.3-70b-versatile`) fallback for digital PDFs and unstructured text. Scanned PDFs need OCR or an image upload with vision fallback enabled.
2. **Structure Preservation:** Replicates the buyer's exact column headers and line items so quotes match the customer's purchase order specifications.
3. **Marine-Grade Calculation Engine:** Deterministic per-line rounding, subtotal integrity, discount protections (capped against negative totals), and multi-currency formatting (USD, EUR, GBP, AED, INR, SGD, JPY).
4. **Branded Maritime PDF Export:** Generates high-density, professional quotations complete with company logos, vessel metadata, terms & conditions, and bank payment instructions.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS + Radix UI Primitives + Lucide Icons
- **Authentication:** [Clerk](https://clerk.com/)
- **Database:** PostgreSQL via `DATABASE_URL` (Neon, Supabase, or another PostgreSQL host)
- **AI Intelligence:** [Groq Cloud SDK](https://groq.com/) (`qwen/qwen3.8-27b` with automatic `llama-3.3-70b-versatile` failover) for ultra-low latency RFQ document extraction; Google Gemini (`gemini-2.5-flash`) for logo color palette extraction
- **PDF Generation:** `jspdf` + `jspdf-autotable` & `@react-pdf/renderer`
- **Testing:** Node.js native test runner + `tsx`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+ installed
- PostgreSQL database (Neon, Supabase, or another PostgreSQL host)
- Clerk application account (for user authentication)
- Groq Cloud API key (for fast RFQ document intelligence)
- (Optional) Google AI Studio API key (for logo palette analysis)

### 2. Installation & Setup

Clone the repository and install dependencies:
```bash
git clone https://github.com/Alfaz-17/QuoteCraft.git
cd QuoteCraft
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:
```env
# Database (use the connection string from your PostgreSQL provider)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Primary AI RFQ Intelligence (Groq Cloud SDK)
GROQ_API_KEY="gsk_..."
GROQ_MODEL="qwen/qwen3.8-27b"

# Optional: Google Gemini API Key (logo extraction & terms)
GEMINI_API_KEY="AIzaSy..."
```

### 4. Running Locally

```bash
# Start development server
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build
```

---

## 🛡️ Security & Math Integrity

- **Locked AI Endpoints:** All AI routes (`/api/ai/*`) strictly enforce session authentication via Clerk and sliding-window rate limiting.
- **Per-Line Rounding:** Row totals are rounded to 2 decimal places per line item before summing, eliminating floating-point rounding drift.
- **Discount Protection:** Flat and percentage discounts are strictly capped against the subtotal to prevent negative quotation totals.
- **Server Recalculation:** When saving quotes (`/api/quotation/save`), row totals and grand totals are verified and recalculated on the server.

---

## 📁 Project Architecture

```
├── docs/                      # Architectural specifications & PRD
│   ├── PRD.md                 # Product requirements document
│   └── UIUX.md                # Design system & maritime aesthetics
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── api/ai/            # RFQ ingestion, logo analysis, terms generation
│   │   ├── api/quotation/     # Quotation CRUD & cloud sync
│   │   ├── dashboard/         # Supplier performance metrics & quick actions
│   │   ├── quotations/        # Searchable quote ledger & management
│   │   └── settings/          # Supplier company profile, branding & keys
│   ├── components/            # UI components (Flow steps, tables, previews)
│   ├── hooks/                 # React state & debounced persistence hooks
│   ├── lib/                   # Database pool, auth helpers, PDF generator
│   └── utils/                 # Financial calculations & math validation
└── tests/                     # Unit test suites
```

---

## 📄 License

Proprietary — All rights reserved.
