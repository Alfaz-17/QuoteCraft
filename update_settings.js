const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'settings', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Sparkles to lucide-react imports if missing
if (!content.includes('Sparkles,')) {
  content = content.replace(
    'ShieldCheck\n} from "lucide-react";',
    'ShieldCheck,\n  Sparkles\n} from "lucide-react";'
  );
  if (!content.includes('Sparkles')) {
    content = content.replace(
      'ShieldCheck\r\n} from "lucide-react";',
      'ShieldCheck,\r\n  Sparkles\r\n} from "lucide-react";'
    );
  }
}

// 2. Add import for logoColorExtractor
if (!content.includes('extractColorsFromImage')) {
  content = content.replace(
    'import { \n  QUOTATION_TEMPLATES,',
    'import { extractColorsFromImage, ExtractedPalette } from "@/utils/logoColorExtractor";\nimport { \n  QUOTATION_TEMPLATES,'
  );
  if (!content.includes('extractColorsFromImage')) {
    content = content.replace(
      'import { \r\n  QUOTATION_TEMPLATES,',
      'import { extractColorsFromImage, ExtractedPalette } from "@/utils/logoColorExtractor";\r\nimport { \r\n  QUOTATION_TEMPLATES,'
    );
  }
}

// 3. Add states and triggerLogoAnalysis inside SettingsPage component
const stateHookTarget = '  const [selectedFont, setSelectedFont] = useState(state.branding.font || "Manrope");';
const stateHookAddition = `  const [selectedFont, setSelectedFont] = useState(state.branding.font || "Manrope");
  const [aiDetectedPalette, setAiDetectedPalette] = useState<ExtractedPalette | null>(null);
  const [isAnalyzingLogo, setIsAnalyzingLogo] = useState(false);

  useEffect(() => {
    if (state.branding.logo && !aiDetectedPalette) {
      extractColorsFromImage(state.branding.logo).then((palette) => {
        setAiDetectedPalette(palette);
      }).catch(() => {});
    }
  }, [state.branding.logo, aiDetectedPalette]);

  const triggerLogoAnalysis = async (customSource?: string) => {
    const source = customSource || state.branding.logo;
    if (!source) {
      toastSuccess("Please upload a company logo first to auto-detect brand colors.");
      return;
    }
    setIsAnalyzingLogo(true);
    try {
      const palette = await extractColorsFromImage(source);
      setAiDetectedPalette(palette);
      setSelectedColor(palette.primaryColor);
      setSelectedSecondary(palette.secondaryColor);
      toastSuccess(\`✨ AI extracted brand colors: \${palette.primaryColor} (Primary) & \${palette.secondaryColor} (Accent)!\`);
    } catch (err) {
      console.warn("Color analysis error:", err);
    } finally {
      setIsAnalyzingLogo(false);
    }
  };`;

if (!content.includes('const [aiDetectedPalette, setAiDetectedPalette]')) {
  content = content.replace(stateHookTarget, stateHookAddition);
}

// 4. Update handleLogoUpload to analyze logo automatically
const oldUploadFn = `    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updatedBranding = { ...state.branding, logo: base64 };
      dispatch({
        type: "SET_BRANDING",
        payload: { logo: base64 },
      });
      try {
        localStorage.setItem("brandingProfile", JSON.stringify(updatedBranding));
      } catch (e) {
        console.error(e);
      }
      toastSuccess("Company logo updated!");
    };
    reader.readAsDataURL(file);`;

const newUploadFn = `    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const updatedBranding = { ...state.branding, logo: base64 };
      dispatch({
        type: "SET_BRANDING",
        payload: { logo: base64 },
      });
      try {
        localStorage.setItem("brandingProfile", JSON.stringify(updatedBranding));
      } catch (e) {
        console.error(e);
      }
      toastSuccess("Company logo updated!");
      await triggerLogoAnalysis(base64);
    };
    reader.readAsDataURL(file);`;

content = content.replace(oldUploadFn, newUploadFn);

// 5. Update Desktop Tab 1 Logo row to include "AI Auto-Detect Palette" button
const desktopLogoButtonsTarget = `<label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0F766E]" />
                      {state.branding.logo ? "Change Logo" : "Upload Custom Logo"}
                    </label>`;

const desktopLogoButtonsReplacement = `<label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0F766E]" />
                      {state.branding.logo ? "Change Logo" : "Upload Custom Logo"}
                    </label>
                    <button
                      type="button"
                      onClick={() => triggerLogoAnalysis()}
                      disabled={isAnalyzingLogo || !state.branding.logo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-50 to-teal-50 border border-teal-200 hover:border-teal-300 text-[#0F766E] text-xs font-bold rounded-xl transition-all shadow-2xs disabled:opacity-50"
                      title="AI detects dominant and secondary brand colors from your logo"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      {isAnalyzingLogo ? "Analyzing Colors..." : "✨ AI Auto-Detect Palette"}
                    </button>`;

if (!content.includes('✨ AI Auto-Detect Palette')) {
  content = content.replace(desktopLogoButtonsTarget, desktopLogoButtonsReplacement);
}

// 6. Update Desktop Tab 2 (Color Palette section) to show AI Logo Match card and detected swatches
const desktopPaletteGridTarget = `<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESET_COLOR_PALETTES.map((palette) => {`;

const desktopPaletteGridReplacement = `<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* AI Logo Palette Card */}
                  {aiDetectedPalette && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColor(aiDetectedPalette.primaryColor);
                        setSelectedSecondary(aiDetectedPalette.secondaryColor);
                      }}
                      className={\`p-3 rounded-md border-2 flex items-center gap-3 text-left transition-all \${
                        selectedColor.toLowerCase() === aiDetectedPalette.primaryColor.toLowerCase()
                          ? "border-[#0F766E] bg-gradient-to-r from-[#E0F2F1]/50 to-amber-50/50 ring-1 ring-[#0F766E]/40"
                          : "border-teal-200 bg-teal-50/20 hover:border-teal-300"
                      }\`}
                    >
                      <div className="w-10 h-10 rounded-xl flex overflow-hidden shadow-2xs shrink-0 border border-slate-200/50">
                        <div className="w-1/2 h-full" style={{ backgroundColor: aiDetectedPalette.primaryColor }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: aiDetectedPalette.secondaryColor }} />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                          <p className="text-xs font-black text-slate-900 truncate">AI Logo Match</p>
                        </div>
                        <p className="text-[11px] text-[#0F766E] font-mono font-bold truncate">
                          {aiDetectedPalette.primaryColor}
                        </p>
                      </div>
                    </button>
                  )}
                  {PRESET_COLOR_PALETTES.map((palette) => {`;

if (!content.includes('AI Logo Match')) {
  content = content.replace(desktopPaletteGridTarget, desktopPaletteGridReplacement);
}

// 7. Add Swatches block below desktop color palette grid
const desktopCustomColorTarget = `{/* Custom Color Input */}
                <div className="flex items-center gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">`;

const desktopCustomColorReplacement = `{/* Detected Logo Swatches */}
                {aiDetectedPalette?.detectedColors && aiDetectedPalette.detectedColors.length > 0 && (
                  <div className="p-3 bg-teal-50/40 border border-teal-200/70 rounded-xl flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5 mr-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      Detected Logo Colors:
                    </span>
                    {aiDetectedPalette.detectedColors.map((hex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(hex)}
                        title={\`Click to set primary color to \${hex}\`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold hover:border-[#0F766E] transition-all shadow-2xs"
                      >
                        <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: hex }} />
                        {hex}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">`;

if (!content.includes('Detected Logo Colors:')) {
  content = content.replace(desktopCustomColorTarget, desktopCustomColorReplacement);
}

// 8. Update Mobile Templates section to include AI Logo Match card
const mobilePaletteTarget = `<div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Brand Color Palette</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_COLOR_PALETTES.map((palette) => (`;

const mobilePaletteReplacement = `<div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Brand Color Palette</Label>
                  {state.branding.logo && (
                    <button
                      type="button"
                      onClick={() => triggerLogoAnalysis()}
                      disabled={isAnalyzingLogo}
                      className="text-xs font-bold text-[#0F766E] flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                      {isAnalyzingLogo ? "Analyzing..." : "AI Auto-Match"}
                    </button>
                  )}
                </div>
                {aiDetectedPalette && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColor(aiDetectedPalette.primaryColor);
                      setSelectedSecondary(aiDetectedPalette.secondaryColor);
                    }}
                    className={\`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all \${
                      selectedColor.toLowerCase() === aiDetectedPalette.primaryColor.toLowerCase()
                        ? "border-[#0F766E] bg-gradient-to-r from-[#E0F2F1]/60 to-amber-50/60 ring-1 ring-[#0F766E]"
                        : "border-teal-200 bg-teal-50/30"
                    }\`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-slate-900">✨ AI Logo Match</p>
                        <p className="text-[11px] text-teal-700 font-mono">{aiDetectedPalette.primaryColor} • {aiDetectedPalette.secondaryColor}</p>
                      </div>
                    </div>
                    <div className="w-10 h-6 rounded-md flex overflow-hidden shadow-2xs border border-slate-200 shrink-0">
                      <div className="w-1/2 h-full" style={{ backgroundColor: aiDetectedPalette.primaryColor }} />
                      <div className="w-1/2 h-full" style={{ backgroundColor: aiDetectedPalette.secondaryColor }} />
                    </div>
                  </button>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_COLOR_PALETTES.map((palette) => (`;

if (content.includes('Label className="text-xs font-bold text-slate-700">Brand Color Palette</Label>')) {
  content = content.replace(mobilePaletteTarget, mobilePaletteReplacement);
}

// 9. Update Mobile Company form sub-screen to include Logo upload and AI analysis
const mobileCompanyFormHeader = `<div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Edit Company Profile</h3>
                <button
                  type="button"
                  onClick={() => setMobileSection("menu")}
                  className="text-xs font-bold text-[#0F766E]"
                >
                  Back
                </button>
              </div>`;

const mobileCompanyFormHeaderReplacement = `<div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Edit Company Profile</h3>
                <button
                  type="button"
                  onClick={() => setMobileSection("menu")}
                  className="text-xs font-bold text-[#0F766E]"
                >
                  Back
                </button>
              </div>

              {/* Mobile Logo Upload Row */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {state.branding.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={state.branding.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Ship className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Company Logo</p>
                    <p className="text-[10px] text-slate-500">Auto-extracted for palette</p>
                  </div>
                </div>
                <label
                  htmlFor="mobile-logo-upload"
                  className="cursor-pointer px-3 py-1.5 bg-[#0F766E] text-white text-xs font-bold rounded-lg shadow-2xs shrink-0"
                >
                  {state.branding.logo ? "Change" : "Upload"}
                </label>
                <input
                  id="mobile-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>`;

if (!content.includes('id="mobile-logo-upload"')) {
  content = content.replace(mobileCompanyFormHeader, mobileCompanyFormHeaderReplacement);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated settings/page.tsx with AI logo color analysis!');

