"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useQuotationState } from "@/hooks/useQuotationState";
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
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { 
  QUOTATION_TEMPLATES, 
  PRESET_COLOR_PALETTES, 
  PRESET_FONTS, 
  TemplateLayoutId 
} from "@/types/quotation.types";

export default function SettingsPage() {
  const { state, dispatch } = useQuotationState();
  const { signOut } = useClerk();
  const { success: toastSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<"company" | "templates" | "business">("company");
  const [mobileSection, setMobileSection] = useState<"menu" | "company" | "templates" | "business">("menu");

  // Company fields
  const [companyName, setCompanyName] = useState(state.company.name || "AURA MARINE SOLUTIONS");
  const [companyEmail, setCompanyEmail] = useState(state.company.email || "info@auramarine.com");
  const [companyPhone, setCompanyPhone] = useState(state.company.phone || "+971 50 123 4567");
  const [companyAddress, setCompanyAddress] = useState(state.company.address || "123 Maritime Street, Dubai, UAE");
  const [companyTaxNo, setCompanyTaxNo] = useState(state.company.taxId || "");

  // Branding & Template fields
  const [selectedLayout, setSelectedLayout] = useState<TemplateLayoutId>(state.branding.layout || "marine");
  const [selectedColor, setSelectedColor] = useState(state.branding.primaryColor || "#0F766E");
  const [selectedSecondary, setSelectedSecondary] = useState(state.branding.secondaryColor || "#F59E0B");
  const [selectedFont, setSelectedFont] = useState(state.branding.font || "Manrope");

  useEffect(() => {
    if (state.company.name) setCompanyName(state.company.name);
    if (state.company.email) setCompanyEmail(state.company.email);
    if (state.company.phone) setCompanyPhone(state.company.phone);
    if (state.company.address) setCompanyAddress(state.company.address);
    if (state.company.taxId) setCompanyTaxNo(state.company.taxId);
  }, [state.company]);

  useEffect(() => {
    if (state.branding.layout) setSelectedLayout(state.branding.layout);
    if (state.branding.primaryColor) setSelectedColor(state.branding.primaryColor);
    if (state.branding.secondaryColor) setSelectedSecondary(state.branding.secondaryColor);
    if (state.branding.font) setSelectedFont(state.branding.font);
  }, [state.branding]);

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
    await signOut({ redirectUrl: "/login" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image should be under 2MB");
      return;
    }

    const reader = new FileReader();
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
              {/* Company Profile Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#E0F2F1] text-[#0F766E] border border-teal-200 flex items-center justify-center p-2 shadow-2xs">
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
                      alt="QuoteCraft Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">
                    {companyName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileSection("company")}
                    className="text-xs font-bold text-[#0F766E] hover:underline mt-1 inline-block"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Navigation List Items with Chevrons */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileSection("company")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Company Details</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setMobileSection("templates")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Quotation Templates & Color</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => toastSuccess("Notification preferences are synced to your account.")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Notification Preferences</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => toastSuccess("Clerk Authentication & Google Gemini AI are active.")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                      <Puzzle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Integrations</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <a
                  href="mailto:support@quotecraft.app"
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                      <LifeBuoy className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Help & Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/50 transition-colors text-rose-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Logout</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          ) : mobileSection === "templates" ? (
            /* Mobile Templates Sub-Screen */
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Template & Branding</h3>
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
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                        selectedLayout === tmpl.id
                          ? "border-[#0F766E] bg-[#E0F2F1]/30 ring-1 ring-[#0F766E]"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{tmpl.name}</span>
                          <span className="text-[10px] font-semibold text-[#0F766E] bg-[#E0F2F1] px-1.5 py-0.2 rounded">
                            {tmpl.source}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{tmpl.description}</p>
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
                <Label className="text-xs font-bold text-slate-700">Brand Color Palette</Label>
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
                      <span className="text-[10px] font-bold text-slate-700">{palette.name}</span>
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
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60"
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
                className="w-full h-11 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white mt-2"
              >
                <Save className="w-4 h-4 mr-1.5" /> Save Template & Colors
              </Button>
            </div>
          ) : (
            /* Mobile Company Form Sub-Screen */
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
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

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Phone</Label>
                <Input
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Address / Port</Label>
                <Input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <Button
                onClick={handleSaveCompany}
                className="w-full h-11 rounded-xl font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white mt-2"
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
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Company Details
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Update your company information. These appear on every quotation PDF.
                </p>
              </div>

              {/* Logo Row with "Change Logo" */}
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
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
                  <p className="text-[11px] text-slate-400 font-medium">
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
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
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
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "border-[#0F766E] bg-[#E0F2F1]/30 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-slate-900">{tmpl.name}</span>
                            <span className="text-[10px] font-bold text-[#0F766E] bg-[#E0F2F1] px-2 py-0.5 rounded-full">
                              {tmpl.source}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500">{tmpl.tagline}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed pt-1">{tmpl.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                          <span className={`text-[11px] font-bold ${isSelected ? "text-[#0F766E]" : "text-slate-400"}`}>
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
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Active: {selectedColor}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                        className={`p-3 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
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
                          <p className="text-[10px] text-slate-400 font-mono truncate">{palette.primaryColor}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                    title="Custom Primary Color"
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Custom Brand Color</p>
                    <p className="text-[11px] text-slate-500">Choose your exact company hex color code</p>
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
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-[#0F766E] bg-[#E0F2F1]/30 ring-1 ring-[#0F766E]/30"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900" style={{ fontFamily: font.fontFamily }}>
                            {font.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {font.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{font.description}</p>
                        <p 
                          className="text-[11px] text-slate-700 mt-2 p-1.5 rounded-lg bg-slate-100/70 truncate"
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
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
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
