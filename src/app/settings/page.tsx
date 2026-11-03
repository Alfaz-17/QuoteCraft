"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { state, dispatch } = useQuotationState();
  const { signOut } = useClerk();
  const { success: toastSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<"company" | "business" | "notifications" | "security">("company");
  const [mobileSection, setMobileSection] = useState<"menu" | "company" | "business">("menu");

  // Company fields
  const [companyName, setCompanyName] = useState(state.company.name || "AURA MARINE SOLUTIONS");
  const [companyEmail, setCompanyEmail] = useState(state.company.email || "info@auramarine.com");
  const [companyPhone, setCompanyPhone] = useState(state.company.phone || "+971 50 123 4567");
  const [companyAddress, setCompanyAddress] = useState(state.company.address || "123 Maritime Street, Dubai, UAE");
  const [companyTaxNo, setCompanyTaxNo] = useState(state.company.taxId || "");

  useEffect(() => {
    if (state.company.name) setCompanyName(state.company.name);
    if (state.company.email) setCompanyEmail(state.company.email);
    if (state.company.phone) setCompanyPhone(state.company.phone);
    if (state.company.address) setCompanyAddress(state.company.address);
    if (state.company.taxId) setCompanyTaxNo(state.company.taxId);
  }, [state.company]);

  const handleSaveCompany = () => {
    dispatch({
      type: "SET_COMPANY",
      payload: {
        name: companyName,
        email: companyEmail,
        phone: companyPhone,
        address: companyAddress,
        taxId: companyTaxNo,
      },
    });
    toastSuccess("Company details updated successfully!");
  };

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/login" });
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
            <Settings className="w-4 h-4 text-blue-600" />
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
              {/* Company Profile Card (Screen 9 in Mobile Mockup) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center p-2 shadow-2xs">
                  {state.branding.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={state.branding.logo}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Ship className="w-8 h-8 stroke-[1.8]" />
                  )}
                </div>

                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">
                    {companyName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileSection("company")}
                    className="text-xs font-bold text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Navigation List Items with Chevrons (Screen 9 in Mobile Mockup) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileSection("company")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Company Details</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <Link
                  href="/templates"
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Quotation Templates</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <button
                  type="button"
                  onClick={() => toastSuccess("Notification preferences are synced to your account.")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
          ) : (
            /* Mobile Form Sub-Screen */
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Edit Company Profile</h3>
                <button
                  type="button"
                  onClick={() => setMobileSection("menu")}
                  className="text-xs font-bold text-blue-600"
                >
                  Done
                </button>
              </div>

              <div className="space-y-3">
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
                  className="w-full h-11 rounded-xl font-bold text-xs bg-blue-600 text-white mt-2"
                >
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
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
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Company Details
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === "business"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Business Info & Terms
            </button>
          </div>

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
                    <div className="text-center">
                      <Ship className="w-7 h-7 text-blue-600 mx-auto stroke-[2]" />
                      <span className="text-[9px] font-bold text-slate-400">Default Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Company Logo</label>
                  <p className="text-[11px] text-slate-500">
                    Recommended size: 300x100px PNG or SVG with transparent background.
                  </p>
                  <div className="pt-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Change Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              dispatch({
                                type: "SET_BRANDING",
                                payload: { logo: reader.result as string },
                              });
                              toastSuccess("Logo updated!");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Fields: Name, Email, Phone, Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Company Name</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="AURA MARINE SOLUTIONS"
                    className="h-10 text-xs sm:text-sm font-semibold rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="info@auramarine.com"
                    className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="h-10 text-xs sm:text-sm font-mono font-medium rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Office / Port Address</Label>
                  <Input
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="123 Maritime Street, Dubai, UAE"
                    className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  onClick={handleSaveCompany}
                  className="h-11 px-6 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 min-h-[44px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === "business" && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Tax & Registration Information
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  TRN / VAT number and default quotation terms.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">TRN / VAT Registration Number</Label>
                  <Input
                    value={companyTaxNo}
                    onChange={(e) => setCompanyTaxNo(e.target.value)}
                    placeholder="100XXXXXXXX00003"
                    className="h-10 text-xs sm:text-sm font-mono font-medium rounded-xl border-slate-200 bg-slate-50/40 focus:bg-white max-w-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Standard Payment & Delivery Terms</Label>
                  <textarea
                    value={state.terms || ""}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_TERMS",
                        payload: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-slate-50/40 focus:bg-white focus:border-blue-600 outline-none resize-none font-medium text-slate-700"
                    placeholder="• Payment: 30 days net from invoice date&#10;• Delivery: Ex-Works Sharjah / FOB Jebel Ali&#10;• Validity: 30 days"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  onClick={handleSaveCompany}
                  className="h-11 px-6 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 min-h-[44px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
