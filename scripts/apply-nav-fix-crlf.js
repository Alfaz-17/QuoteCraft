const fs = require('fs');
const path = require('path');

// 1. Sidebar.tsx
const sidebarPath = path.join(__dirname, '..', 'src', 'components', 'layout', 'Sidebar.tsx');
let sidebar = fs.readFileSync(sidebarPath, 'utf8');
sidebar = sidebar.replace(
  '["/dashboard", "/quotations", "/templates", "/settings"]',
  '["/dashboard", "/", "/quotations", "/settings"]'
);
fs.writeFileSync(sidebarPath, sidebar, 'utf8');
console.log('Sidebar updated');

// 2. page.tsx
const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');

// Ensure ArrowLeft is imported
if (!page.includes('ArrowLeft')) {
  page = page.replace(
    /LayoutDashboard\s*\r?\n/,
    'LayoutDashboard, ArrowLeft\n'
  );
}

// Replace header toolbar in page.tsx
const oldHeaderStart = '{/* ===== NATIVE APP TOOLBAR (z-30) ===== */}';
const headerEnd = '{/* ===== 3-STEP NATIVE NAVIGATION BAR';

const hStartIdx = page.indexOf(oldHeaderStart);
const hEndIdx = page.indexOf(headerEnd);

if (hStartIdx !== -1 && hEndIdx !== -1) {
  const newHeader = `{/* ===== NATIVE APP TOOLBAR (z-30) ===== */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 sm:px-6 py-2 pt-[max(0.6rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] flex items-center justify-between z-30 shadow-2xs app-chrome select-none">
        {/* Brand & Document Info (Back arrow + Logo + Quote number) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <Link
            href="/dashboard"
            className="p-1 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors shrink-0 flex items-center justify-center min-h-[40px] min-w-[40px]"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>

          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 group" title="QuoteCraft Dashboard">
            <QuoteCraftLogo size={28} showText={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-[#0F172A] leading-none group-hover:text-[#0F766E] transition-colors truncate">
                  Quote<span className="text-[#0F766E]">Craft</span>
                </h1>
                {isHydrated && state.documentInfo.number && (
                  <span
                    suppressHydrationWarning
                    className="text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0 truncate max-w-[85px] sm:max-w-none"
                  >
                    {state.documentInfo.number}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Toolbar Controls (Streamlined, strictly single line on mobile) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-nowrap">
          {/* Autosave status indicator */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200 shrink-0">
            {isSaved ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-800 font-bold hidden sm:inline">Saved</span>
              </>
            ) : (
              <>
                <DualOrbitalSpinner size="sm" />
                <span className="text-amber-800 hidden sm:inline">Saving...</span>
              </>
            )}
          </div>

          {/* Undo button */}
          <button
            type="button"
            onClick={handleUndo}
            className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors active:scale-95 shrink-0"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Company Profile button */}
          <button
            type="button"
            onClick={() => setShowCompanyModal(true)}
            className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors active:scale-95 shrink-0"
            title="Company Profile"
            aria-label="Company Profile"
          >
            <Building2 className="w-4 h-4 text-[#0F766E]" />
            <span className="hidden sm:inline">Company Profile</span>
          </button>

          {/* Live Grand Total pill (desktop only) */}
          {isHydrated && state.items.length > 0 && grandTotal > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800 shadow-2xs shrink-0">
              <span className="text-xs font-sans text-emerald-700 font-semibold">Total:</span>
              <span>{currencySymbol}{grandTotal.toLocaleString(state.currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 0 })}</span>
            </div>
          )}

          {/* New Quote button */}
          <button
            type="button"
            onClick={handleNewQuote}
            className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-lg font-bold text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            title="Start fresh quotation"
            aria-label="New Quote"
          >
            <FilePlus className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">New Quote</span>
          </button>
        </div>
      </header>\n\n      `;

  page = page.substring(0, hStartIdx) + newHeader + page.substring(hEndIdx);
  fs.writeFileSync(pagePath, page, 'utf8');
  console.log('page.tsx updated');
} else {
  console.error('Could not find header markers in page.tsx', { hStartIdx, hEndIdx });
}

