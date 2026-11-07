"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQuotationState } from "@/hooks/useQuotationState";
import { HeroSailingLoader } from "@/components/ui/Loaders";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Save, 
  Ship, 
  Settings, 
  Building, 
  Layers, 
  Bell, 
  Puzzle, 
  LifeBuoy, 
  LogOut, 
  ChevronRight,
  ArrowLeft,
  Palette,
  Type,
  CheckCircle2,
  FileText,
  Sliders,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { extractColorsFromImage, ExtractedPalette } from "@/utils/logoColorExtractor";
import { 
  QUOTATION_TEMPLATES, 
  PRESET_COLOR_PALETTES, 
  PRESET_FONTS, 
  TemplateLayoutId 
} from "@/types/quotation.types";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { state, dispatch } = useQuotationState();
  const { signOut } = useClerk();
  const { success: toastSuccess } = useToast();

  const userName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Alfaz Bilakhiya";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "alfazbilakhiya17@gmail.com";
  const userInitial = (user?.firstName?.[0] || userName[0] || "A").toUpperCase();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const [activeTab, setActiveTab] = useState<"company" | "templates" | "business">("company");
  const [mobileSection, setMobileSection] = useState<"menu" | "company" | "templates" | "business">("menu");

  // Company fields (initialized strictly from user's saved company profile, no fake data)
  const [companyName, setCompanyName] = useState(state.company.name || "");
  const [companyEmail, setCompanyEmail] = useState(state.company.email || "");
  const [companyPhone, setCompanyPhone] = useState(state.company.phone || "");
  const [companyAddress, setCompanyAddress] = useState(state.company.address || "");
  const [companyTaxNo, setCompanyTaxNo] = useState(state.company.taxId || "");

  // Branding & Template fields
  const [selectedLayout, setSelectedLayout] = useState<TemplateLayoutId>(state.branding.layout || "marine");
  const [selectedColor, setSelectedColor] = useState(state.branding.primaryColor || "#0F766E");
  const [selectedSecondary, setSelectedSecondary] = useState(state.branding.secondaryColor || "#F59E0B");
  const [selectedFont, setSelectedFont] = useState(state.branding.font || "Manrope");
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
      toastSuccess(`✨ AI extracted brand colors: ${palette.primaryColor} (Primary) & ${palette.secondaryColor} (Accent)!`);
    } catch (err) {
      console.warn("Color analysis error:", err);
    } finally {
      setIsAnalyzingLogo(false);
    }
  };

  // Sync with hydrated quotation context
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.company.name) setCompanyName(state.company.name);
    if (state.company.email) setCompanyEmail(state.company.email);
    if (state.company.phone) setCompanyPhone(state.company.phone);
    if (state.company.address) setCompanyAddress(state.company.address);
    if (state.company.taxId) setCompanyTaxNo(state.company.taxId);
  }, [state.company]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.branding.layout) setSelectedLayout(state.branding.layout);
    if (state.branding.primaryColor) setSelectedColor(state.branding.primaryColor);
    if (state.branding.secondaryColor) setSelectedSecondary(state.branding.secondaryColor);
    if (state.branding.font) setSelectedFont(state.branding.font);
  }, [state.branding]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <HeroSailingLoader statusMessage="Verifying authorization..." />
      </div>
    );
  }

  const handleSaveCompany = () => {
    const updatedCompany = {
      name: companyName,
      email: companyEmail,
      phone: companyPhone,
      address: companyAddress,
      taxId: companyTaxNo,
    };
    dispatch({
      type: "SET_COMPANY",
      payload: updatedCompany,
    });
    try {
      localStorage.setItem("companyProfile", JSON.stringify(updatedCompany));
    } catch (e) {
      console.error(e);
    }
    toastSuccess("Company details updated successfully!");
  };

  const handleSaveBranding = () => {
    const updatedBranding = {
      ...state.branding,
      layout: selectedLayout,
      primaryColor: selectedColor,
      secondaryColor: selectedSecondary,
      font: selectedFont,
    };
    dispatch({
      type: "SET_BRANDING",
      payload: updatedBranding,
    });
    try {
      localStorage.setItem("brandingProfile", JSON.stringify(updatedBranding));
    } catch (e) {
      console.error(e);
    }
    toastSuccess("Template format and color branding updated successfully!");
  };

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/sign-in" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image should be under 2MB");
      return;
    }

    const reader = new FileReader();
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
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen text-slate-900 pb-24 md:pb-12">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mobileSection !== "menu" && (
              <button
                type="button"
                onClick={() => setMobileSection("menu")}
                className="md:hidden text-slate-500 hover:text-slate-800 mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Settings className="w-4 h-4 text-[#0F766E]" />
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-5 animate-in fade-in duration-300">
        {/* ── MOBILE SETTINGS VIEW (Screen 9 in Mobile Mockup: block md:hidden) ── */}
        <div className="block md:hidden space-y-4">
          {mobileSection === "menu" ? (
            <div className="space-y-4">
              {/* User Profile Card (Screen 9 visual reference) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-2xs overflow-hidden">
                  {user?.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.imageUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                    {userName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Grouped Settings Navigation Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileSection("company")}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Company Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setMobileSection("templates")}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Branding &amp; Design</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setMobileSection("business")}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Quotation Preferences</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setMobileSection("business")}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Business Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => toastSuccess("Account & security managed securely via Clerk.")}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Account &amp; Security</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Sign Out Action Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-left font-bold text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : mobileSection === "templates" ? (
            /* Mobile Templates Sub-Screen */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Branding &amp; Templates</h3>
                <button
                  type="button"
                  onClick={() => setMobileSection("menu")}
                  className="text-xs font-bold text-[#0F766E]"
                >
                  Back
                </button>
              </div>

              {/* Template Format Options */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Choose Template Format</Label>
                <div className="space-y-2">
                  {QUOTATION_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedLayout(tmpl.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                        selectedLayout === tmpl.id
                          ? "border-[#0F766E] bg-[#E0F2F1]/30 ring-1 ring-[#0F766E]"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{tmpl.name}</span>
                          <span className="text-xs font-semibold text-[#0F766E] bg-[#E0F2F1] px-2 py-0.5 rounded">
                            {tmpl.source}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{tmpl.description}</p>
                      </div>
                      {selectedLayout === tmpl.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette Selector */}
              <div className="space-y-2">
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
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      selectedColor.toLowerCase() === aiDetectedPalette.primaryColor.toLowerCase()
                        ? "border-[#0F766E] bg-gradient-to-r from-[#E0F2F1]/60 to-amber-50/60 ring-1 ring-[#0F766E]"
                        : "border-teal-200 bg-teal-50/30"
                    }`}
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
                  {PRESET_COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => {
                        setSelectedColor(palette.primaryColor);
                        setSelectedSecondary(palette.secondaryColor);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        selectedColor.toLowerCase() === palette.primaryColor.toLowerCase()
                          ? "border-[#0F766E] bg-[#E0F2F1]/30 ring-1 ring-[#0F766E]"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex overflow-hidden shadow-2xs">
                        <div className="w-1/2 h-full" style={{ backgroundColor: palette.primaryColor }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: palette.secondaryColor }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Quotation Font</Label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full h-11 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60"
                >
                  {PRESET_FONTS.map((font) => (
                    <option key={font.id} value={font.name}>
                      {font.name} — {font.description}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleSaveBranding}
                className="w-full h-12 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white mt-2"
              >
                <Save className="w-4 h-4 mr-1.5" /> Save Template &amp; Colors
              </Button>
            </div>
          ) : mobileSection === "business" ? (
            /* Mobile Business & Terms Sub-Screen */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Business Info &amp; Terms</h3>
                <button
                  type="button"
                  onClick={() => setMobileSection("menu")}
                  className="text-xs font-bold text-[#0F766E]"
                >
                  Back
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Bank Account Details (Swift / IBAN)</Label>
                <textarea
                  rows={4}
                  value={state.company.bankDetails || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_COMPANY",
                      payload: { bankDetails: e.target.value },
                    })
                  }
                  placeholder="Bank: Emirates NBD&#10;IBAN: AE2902600010029384810&#10;SWIFT: ENBDAEAD"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0F766E] outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Standard Commercial Terms</Label>
                <textarea
                  rows={4}
                  value={state.terms}
                  onChange={(e) => dispatch({ type: "SET_TERMS", payload: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0F766E] outline-none leading-relaxed"
                  placeholder="• Delivery: Ex-Works&#10;• Payment: 30 days&#10;• Validity: 30 days"
                />
              </div>

              <Button
                onClick={() => {
                  toastSuccess("Business settings updated successfully!");
                  setMobileSection("menu");
                }}
                className="w-full h-12 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white mt-2"
              >
                <Save className="w-4 h-4 mr-1.5" /> Save Business Settings
              </Button>
            </div>
          ) : (
            /* Mobile Company Form Sub-Screen */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
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
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Phone</Label>
                <Input
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="h-11 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Address / Port</Label>
                <Input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="h-11 text-xs rounded-xl"
                />
              </div>

              <Button
                onClick={handleSaveCompany}
                className="w-full h-12 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white mt-2"
              >
                <Save className="w-4 h-4 mr-1.5" /> Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* ── DESKTOP SETTINGS TABS (hidden md:block) ── */}
        <div className="hidden md:block space-y-6">
          <div className="border-b border-slate-200 flex items-center gap-6 text-xs sm:text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("company")}
              className={`py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === "company"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Company Details
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "templates"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Palette className="w-4 h-4" />
              Templates & Color Palette
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === "business"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Business Info & Terms
            </button>
          </div>

          {/* TAB 1: COMPANY DETAILS */}
          {activeTab === "company" && (
            <div className="bg-white rounded-lg border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Company Details
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Update your company information. These appear on every quotation PDF.
                </p>
              </div>

              {/* Logo Row with "Change Logo" */}
              <div className="flex items-center gap-5 p-4 rounded-md bg-slate-50/70 border border-slate-100">
                <div className="w-24 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-2xs">
                  {state.branding.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={state.branding.logo}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/logo-mark.png"
                      alt="Default Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label
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
                    </button>
                    {state.branding.logo && (
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: "SET_BRANDING", payload: { logo: null } });
                          toastSuccess("Reset to default QuoteCraft logo.");
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    PNG, JPG, or SVG. Maximum 2MB.
                  </p>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Company Name</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-11 rounded-xl text-xs font-medium"
                    placeholder="e.g. AURA MARINE SOLUTIONS"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Official Email</Label>
                  <Input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="h-11 rounded-xl text-xs font-medium"
                    placeholder="info@auramarine.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Phone / WhatsApp</Label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="h-11 rounded-xl text-xs font-medium font-mono"
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Business Address / Port Base</Label>
                  <Input
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="h-11 rounded-xl text-xs font-medium"
                    placeholder="123 Maritime Street, Dubai, UAE"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Tax ID / VAT Registration No. (Optional)</Label>
                  <Input
                    value={companyTaxNo}
                    onChange={(e) => setCompanyTaxNo(e.target.value)}
                    className="h-11 rounded-xl text-xs font-medium font-mono"
                    placeholder="e.g. TRN-10029384810"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleSaveCompany}
                  className="h-11 px-6 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-xs"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Company Details
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: TEMPLATES & BRANDING (NEW!) */}
          {activeTab === "templates" && (
            <div className="bg-white rounded-lg border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0F766E]" />
                  Quotation Templates & Color Palettes
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select your default layout format, corporate color scheme, and typography for quotation PDFs.
                </p>
              </div>

              {/* 1. Template Layout Cards (3-4 Formats including Anvil and Example 1) */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Template Format
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {QUOTATION_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedLayout === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedLayout(tmpl.id)}
                        className={`p-4 rounded-md border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "border-[#0F766E] bg-[#E0F2F1]/30 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-slate-900">{tmpl.name}</span>
                            <span className="text-xs font-bold text-[#0F766E] bg-[#E0F2F1] px-2.5 py-0.5 rounded-full">
                              {tmpl.source}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">{tmpl.tagline}</p>
                          <p className="text-xs text-slate-600 leading-relaxed pt-1">{tmpl.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                          <span className={`text-xs font-bold ${isSelected ? "text-[#0F766E]" : "text-slate-500"}`}>
                            {isSelected ? "Active Default Template" : "Click to Select"}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Color Palette Selector */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-[#0F766E]" />
                    2. Color Palette
                  </Label>
                  <div className="flex items-center gap-3">
                    {state.branding.logo && (
                      <button
                        type="button"
                        onClick={() => triggerLogoAnalysis()}
                        disabled={isAnalyzingLogo}
                        className="text-xs font-bold text-[#0F766E] flex items-center gap-1.5 hover:underline bg-[#E0F2F1]/60 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        {isAnalyzingLogo ? "Analyzing Logo..." : "✨ AI Match From Logo"}
                      </button>
                    )}
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Active: {selectedColor}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* AI Logo Palette Card */}
                  {aiDetectedPalette && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedColor(aiDetectedPalette.primaryColor);
                        setSelectedSecondary(aiDetectedPalette.secondaryColor);
                      }}
                      className={`p-3 rounded-md border-2 flex items-center gap-3 text-left transition-all ${
                        selectedColor.toLowerCase() === aiDetectedPalette.primaryColor.toLowerCase()
                          ? "border-[#0F766E] bg-gradient-to-r from-[#E0F2F1]/60 to-amber-50/60 ring-1 ring-[#0F766E]/40"
                          : "border-teal-200 bg-teal-50/20 hover:border-teal-300"
                      }`}
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
                  {PRESET_COLOR_PALETTES.map((palette) => {
                    const isActive = selectedColor.toLowerCase() === palette.primaryColor.toLowerCase();
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => {
                          setSelectedColor(palette.primaryColor);
                          setSelectedSecondary(palette.secondaryColor);
                        }}
                        className={`p-3 rounded-md border-2 flex items-center gap-3 text-left transition-all ${
                          isActive
                            ? "border-[#0F766E] bg-[#E0F2F1]/30 ring-1 ring-[#0F766E]/30"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl flex overflow-hidden shadow-2xs shrink-0 border border-slate-200/50">
                          <div className="w-1/2 h-full" style={{ backgroundColor: palette.primaryColor }} />
                          <div className="w-1/2 h-full" style={{ backgroundColor: palette.secondaryColor }} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 truncate">{palette.name}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">{palette.primaryColor}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detected Logo Swatches */}
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
                        title={`Click to set primary color to ${hex}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold hover:border-[#0F766E] transition-all shadow-2xs"
                      >
                        <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: hex }} />
                        {hex}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                    title="Custom Primary Color"
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Custom Brand Color</p>
                    <p className="text-xs text-slate-500">Choose your exact company hex color code</p>
                  </div>
                  <Input
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-28 h-9 text-xs font-mono font-bold uppercase rounded-lg"
                  />
                </div>
              </div>

              {/* 3. Typography / Font Selector */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-[#0F766E]" />
                  3. Typography & Font Style
                </Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_FONTS.map((font) => {
                    const isSelected = selectedFont.toLowerCase() === font.name.toLowerCase();
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setSelectedFont(font.name)}
                        className={`p-3.5 rounded-md border-2 text-left transition-all ${
                          isSelected
                            ? "border-[#0F766E] bg-[#E0F2F1]/30 ring-1 ring-[#0F766E]/30"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900" style={{ fontFamily: font.fontFamily }}>
                            {font.name}
                          </span>
                          <span className="text-xs font-mono text-slate-500 uppercase">
                            {font.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{font.description}</p>
                        <p 
                          className="text-xs text-slate-700 mt-2 p-1.5 rounded-lg bg-slate-100/70 truncate"
                          style={{ fontFamily: font.fontFamily }}
                        >
                          CYLINDER LINER • CL-102 • $1,250.00
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Branding CTA */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleSaveBranding}
                  className="h-11 px-6 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-xs"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Template & Color Branding
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: BUSINESS INFO & TERMS */}
          {activeTab === "business" && (
            <div className="bg-white rounded-lg border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Business Info & Default Commercial Terms
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure default payment, delivery terms, and bank coordinates.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Bank Account Details (Swift / IBAN)</Label>
                  <textarea
                    rows={4}
                    value={state.company.bankDetails || ""}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_COMPANY",
                        payload: { bankDetails: e.target.value },
                      })
                    }
                    placeholder="Bank: Emirates NBD&#10;IBAN: AE2902600010029384810&#10;SWIFT: ENBDAEAD"
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0F766E] outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Standard Commercial Terms</Label>
                  <textarea
                    rows={5}
                    value={state.terms}
                    onChange={(e) => dispatch({ type: "SET_TERMS", payload: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0F766E] outline-none leading-relaxed"
                    placeholder="• Delivery: As agreed / Ex-Works / FOB&#10;• Payment: 30 days after delivery&#10;• Validity: 30 days"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={() => toastSuccess("Business details and commercial terms saved!")}
                  className="h-11 px-6 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-xs"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Business Info
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
