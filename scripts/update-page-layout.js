const fs = require("fs");
let content = fs.readFileSync("src/app/page.tsx", "utf8");

// Standardize newlines
content = content.replace(/\r\n/g, "\n");

// Update imports
content = content.replace(
  `import { RotateCcw, FilePlus, ArrowLeft } from "lucide-react";`,
  `import { ArrowLeft, MoreVertical, RotateCcw, FilePlus, Building2, LayoutDashboard, RefreshCw } from "lucide-react";`
);

// Add showMoreMenu state after showCompanyModal
content = content.replace(
  `  const [showCompanyModal, setShowCompanyModal] = useState(false);`,
  `  const [showCompanyModal, setShowCompanyModal] = useState(false);\n  const [showMoreMenu, setShowMoreMenu] = useState(false);`
);

// Replace header and remove StepNavigation
const oldHeaderAndNav = `      {/* ===== NATIVE APP TOOLBAR (z-30) ===== */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 sm:px-6 py-2 pt-[max(0.6rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] flex items-center justify-between z-30 shadow-2xs app-chrome select-none">
        {/* Brand & Back arrow (No quote name/number in navbar) */}
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
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-[#0F172A] leading-none group-hover:text-[#0F766E] transition-colors truncate">
              Quote<span className="text-[#0F766E]">Craft</span>
            </h1>
          </Link>
        </div>

        {/* Toolbar Controls (Only Undo and New Quote) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
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
      </header>

      {/* ===== 3-STEP NATIVE NAVIGATION BAR (z-20) ===== */}
      <div className="shrink-0 z-20">
        <StepNavigation
          currentStep={currentStep}
          onStepChange={(s) => setCurrentStep(s)}
          itemCount={state.items.length}
          hasItems={state.items.length > 0}
        />
      </div>`;

const newHeader = `      {/* ===== COMPACT NATIVE HEADER (56px, z-30) ===== */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-3.5 sm:px-6 py-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] flex items-center justify-between z-30 select-none">
        {/* Left: Back button & Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard"
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 group" title="QuoteCraft Dashboard">
            <QuoteCraftLogo size={26} showText={false} />
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#172033] leading-none group-hover:text-[#347A72] transition-colors truncate">
              Quote<span className="text-[#347A72]">Craft</span>
            </span>
            {state.documentInfo?.number && (
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                {state.documentInfo.number}
              </span>
            )}
          </Link>
        </div>

        {/* Right: Quick Undo + More Actions (⋮) Menu */}
        <div className="relative flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="More actions"
            aria-label="More actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* More Actions Dropdown Menu */}
          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl py-2 text-xs font-semibold animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleNewQuote();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <FilePlus className="w-4 h-4 text-[#347A72]" />
                  <span>Start New Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowCompanyModal(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-[#347A72]" />
                  <span>Company Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleClearExtraction();
                  }}
                  className="w-full px-4 py-2.5 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                  <span>Reset Extracted Items</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/dashboard"
                  onClick={() => setShowMoreMenu(false)}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Exit to Dashboard</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </header>`;

content = content.replace(oldHeaderAndNav, newHeader);

fs.writeFileSync("src/app/page.tsx", content, "utf8");
console.log("Updated src/app/page.tsx header and navigation successfully.");

