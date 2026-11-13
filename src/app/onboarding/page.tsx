"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { 
  Building2, 
  Palette, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Upload, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Receipt, 
  FileText, 
  CheckCircle2, 
  Loader2,
  Trash2,
  LogOut,
  Hash
} from "lucide-react";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { HeroSailingLoader } from "@/components/ui/Loaders";
import { useToast } from "@/components/ui/Toast";
import { analyzeLogoPalette, ExtractedPalette } from "@/utils/logoColorExtractor";
import { Currency, CURRENCY_SYMBOLS } from "@/types/quotation.types";

const PRESET_COLORS = [
  { name: "Ocean Teal", hex: "#0F766E", text: "text-teal-700", bg: "bg-teal-50" },
  { name: "Deep Navy", hex: "#1E3A8A", text: "text-blue-700", bg: "bg-blue-50" },
  { name: "Emerald Port", hex: "#047857", text: "text-emerald-700", bg: "bg-emerald-50" },
  { name: "Maritime Slate", hex: "#334155", text: "text-slate-700", bg: "bg-slate-50" },
  { name: "Royal Blue", hex: "#2563EB", text: "text-indigo-700", bg: "bg-indigo-50" },
];

const DEFAULT_MARITIME_TERMS = `1. Validity: 30 days from date of quotation.
2. Delivery Basis: Ex-Works / Free on Board (FOB) vessel at port of supply.
3. Payment Terms: 30 days net from invoice date.
4. Stock and prices are subject to final confirmation upon receipt of official PO.`;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { success: toastSuccess, error: toastError } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // ── Step 1: Company Profile ───────────────────────────────────────────────
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");

  // ── Step 2: Branding & Terms ─────────────────────────────────────────────
  const [logo, setLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0F766E");
  const [secondaryColor, setSecondaryColor] = useState("#F59E0B");
  const [quotePrefix, setQuotePrefix] = useState("QT-");
  const [terms, setTerms] = useState(DEFAULT_MARITIME_TERMS);
  const [isAnalyzingLogo, setIsAnalyzingLogo] = useState(false);
  const [aiDetectedPalette, setAiDetectedPalette] = useState<ExtractedPalette | null>(null);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth check & pre-populate
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    // Pre-fill user data from Clerk
    const clerkEmail = user?.primaryEmailAddress?.emailAddress || "";
    const clerkName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "";
    setEmail(clerkEmail);
    setContactPerson(clerkName);

    // Check existing profile
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.company?.name) {
            setAlreadyCompleted(true);
            const comp = data.profile.company;
            setCompanyName(comp.name || "");
            setEmail(comp.email || clerkEmail);
            setPhone(comp.phone || "");
            setAddress(comp.address || "");
            setTaxId(comp.taxId || "");
            setWebsite(comp.website || "");

            if (data.profile.branding) {
              setPrimaryColor(data.profile.branding.primaryColor || "#0F766E");
              setSecondaryColor(data.profile.branding.secondaryColor || "#F59E0B");
            }
            if (data.profile.terms) {
              setTerms(data.profile.terms);
            }
            if (data.profile.builderConfig?.quotePrefix) {
              setQuotePrefix(data.profile.builderConfig.quotePrefix);
            }
          }
        }
      } catch (err) {
        console.warn("Could not check existing profile", err);
      } finally {
        // Load saved logo from localStorage if available
        try {
          const directLogo = localStorage.getItem("companyLogo");
          if (directLogo) {
            setLogo(directLogo);
          } else {
            const savedBranding = localStorage.getItem("brandingProfile");
            if (savedBranding) {
              const parsed = JSON.parse(savedBranding);
              if (parsed.logo) setLogo(parsed.logo);
            }
          }
        } catch {
          // ignore
        }
        setLoadingInitial(false);
      }
    })();
  }, [isLoaded, isSignedIn, user, router]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError("Logo image size should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLogo(base64);
      setIsAnalyzingLogo(true);
      try {
        const palette = await analyzeLogoPalette(base64);
        setAiDetectedPalette(palette);
        setPrimaryColor(palette.primaryColor);
        setSecondaryColor(palette.secondaryColor);
        toastSuccess(palette.source === "ai" ? "AI matched your logo colors." : "Logo colors detected and applied.");
      } catch (err) {
        console.warn("AI color extraction failed", err);
      } finally {
        setIsAnalyzingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) {
      errs.companyName = "Company or Chandler name is required";
    }
    if (!email.trim() || !email.includes("@")) {
      errs.email = "Valid business email is required";
    }
    if (!phone.trim()) {
      errs.phone = "Contact phone or WhatsApp is required";
    }
    if (!address.trim()) {
      errs.address = "Port or office address is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toastError("Please complete the required company details.");
    }
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const companyPayload = {
        name: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        taxId: taxId.trim(),
        website: website.trim(),
        contactPerson: contactPerson.trim(),
      };

      const brandingPayload = {
        primaryColor,
        secondaryColor,
        textColor: "#0F172A",
        font: "Manrope",
        layout: "marine",
      };

      const builderConfigPayload = {
        onboardingCompleted: true,
        quotePrefix: quotePrefix.trim() || "QT-",
        currency,
      };

      // 1. Save to Database
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: companyPayload,
          branding: brandingPayload,
          terms: terms.trim(),
          builderConfig: builderConfigPayload,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile to server");
      }

      // 2. Sync to Browser LocalStorage
      try {
        localStorage.setItem("companyProfile", JSON.stringify(companyPayload));
        localStorage.setItem(
          "brandingProfile",
          JSON.stringify({ ...brandingPayload, logo })
        );
        if (logo) {
          localStorage.setItem("companyLogo", logo);
        }
        localStorage.setItem("defaultTerms", terms.trim());
        localStorage.setItem("onboardingCompleted", "true");
        localStorage.setItem("userCurrency", currency);
      } catch (storageErr) {
        console.warn("Storage sync warning", storageErr);
      }

      toastSuccess("🎉 Welcome aboard! Your company profile is ready.");
      // Hard reload to dashboard so root QuotationProvider cleanly initializes with new profile
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      console.error("Onboarding submission error", err);
      toastError(err instanceof Error ? err.message : "Failed to finish onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || loadingInitial) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-4">
        <HeroSailingLoader statusMessage="Initializing your workspace..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E293B] flex flex-col font-sans selection:bg-[#0F766E]/15 selection:text-[#0F766E]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#ECE7DE]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <QuoteCraftLogo size={32} showTagline={false} />
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500">
              Signed in as <strong className="text-slate-800">{email}</strong>
            </span>
            <button
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Already Completed Banner */}
        {alreadyCompleted && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 text-teal-900 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span>You have already completed onboarding. Update details below or proceed to your dashboard.</span>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stepper Card */}
        <div className="mb-8 bg-white border border-[#ECE7DE] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 1 ? 'bg-[#0F766E] text-white' : 'bg-teal-100 text-teal-800'}`}>
                {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Step 1</p>
                <p className={`text-sm font-bold ${step === 1 ? 'text-slate-900' : 'text-slate-600'}`}>Company Details</p>
              </div>
            </div>

            <div className="flex-1 mx-4 h-0.5 bg-slate-200 hidden sm:block relative overflow-hidden">
              <div 
                className="h-full bg-[#0F766E] transition-all duration-300"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 2 ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-500'}`}>
                2
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Step 2</p>
                <p className={`text-sm font-bold ${step === 2 ? 'text-slate-900' : 'text-slate-600'}`}>Branding & Defaults</p>
              </div>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-500">
            {step === 1 
              ? "Tell us about your marine chandlery or supply business. These details appear on your quotation headers."
              : "Upload your company logo and set default terms to automatically brand all future quotations."}
          </p>
        </div>

        {/* Step 1: Company Profile */}
        {step === 1 && (
          <div className="bg-white border border-[#ECE7DE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Company & Port Information
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                This information will appear at the top of every generated marine quotation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Company Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#0F766E]" /> Company / Chandler Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (errors.companyName) setErrors({ ...errors, companyName: "" });
                  }}
                  placeholder="e.g. Seven Seas Marine Supply & Logistics LLC"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${errors.companyName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300 focus:border-[#0F766E]'}`}
                />
                {errors.companyName && (
                  <p className="text-xs font-semibold text-rose-500">{errors.companyName}</p>
                )}
              </div>

              {/* Operating Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#0F766E]" /> Default Currency <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#0F766E] text-sm font-bold bg-white text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="AED">AED (AED) - UAE Dirham</option>
                  <option value="SGD">SGD (S$) - Singapore Dollar</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                </select>
                <p className="text-[11px] text-slate-400 font-medium">Standard currency for all new quotes (switchable per quote).</p>
              </div>

              {/* Contact Person */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  Contact Person / Signatory
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Capt. James Miller"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#0F766E] text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              {/* Business Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0F766E]" /> Business Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  placeholder="chandler@sevenseasmarine.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300 focus:border-[#0F766E]'}`}
                />
                {errors.email && (
                  <p className="text-xs font-semibold text-rose-500">{errors.email}</p>
                )}
              </div>

              {/* Phone / WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0F766E]" /> Phone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                  }}
                  placeholder="+971 4 321 0000 / +65 6789 1234"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300 focus:border-[#0F766E]'}`}
                />
                {errors.phone && (
                  <p className="text-xs font-semibold text-rose-500">{errors.phone}</p>
                )}
              </div>

              {/* Address / Port */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0F766E]" /> Port Office / Physical Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({ ...errors, address: "" });
                  }}
                  placeholder="e.g. Shed 14, Al Jadaf Drydocks, P.O. Box 4501, Dubai, UAE"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300 focus:border-[#0F766E]'}`}
                />
                {errors.address && (
                  <p className="text-xs font-semibold text-rose-500">{errors.address}</p>
                )}
              </div>

              {/* Tax / VAT ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tax / VAT / TRN / Registration No. (Optional)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. TRN 100234567800003"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#0F766E] text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0F766E]" /> Website (Optional)
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. www.sevenseasmarine.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#0F766E] text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-sm font-extrabold shadow-md shadow-[#0F766E]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Continue to Branding & Logo <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Branding & Quotation Defaults */}
        {step === 2 && (
          <div className="bg-white border border-[#ECE7DE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Branding & Quotation Defaults
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Customize your quote design and default terms. You can change these anytime in Settings.
              </p>
            </div>

            {/* Logo Upload Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#0F766E]" /> Company Logo
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                {logo ? (
                  <div className="relative w-24 h-24 rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center shadow-sm shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-200/60 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0F766E] text-slate-700 hover:text-[#0F766E] text-xs font-bold transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logo ? "Replace Logo" : "Upload Logo Image"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {isAnalyzingLogo && (
                      <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting brand palette...
                      </span>
                    )}

                    {aiDetectedPalette && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" /> {aiDetectedPalette.source === "ai" ? "AI Matched Colors" : "Logo Colors Detected"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    PNG, JPG, SVG up to 2MB. Transparent background recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Color Theme */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#0F766E]" /> Brand Primary Color
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setPrimaryColor(preset.hex)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${primaryColor.toLowerCase() === preset.hex.toLowerCase() ? 'border-[#0F766E] bg-teal-50/50 ring-2 ring-[#0F766E]/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <span className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: preset.hex }} />
                    <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Hex Picker */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-600">Custom Hex:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-24 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Quotation Numbering Prefix */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#0F766E]" /> Quotation Numbering Prefix
              </label>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="text"
                  value={quotePrefix}
                  onChange={(e) => setQuotePrefix(e.target.value.toUpperCase())}
                  placeholder="QT-"
                  className="w-32 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#0F766E] text-sm font-bold font-mono tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
                <span className="text-xs text-slate-500 font-semibold">
                  Sample: <strong className="text-slate-800 font-mono">{quotePrefix || "QT-"}1001</strong>
                </span>
              </div>
            </div>

            {/* Default Terms & Conditions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0F766E]" /> Default Marine Terms & Conditions
              </label>
              <textarea
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#0F766E] text-xs font-mono text-slate-700 leading-relaxed transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                placeholder="Enter standard quotation terms..."
              />
              <p className="text-[11px] text-slate-400 font-medium">
                These terms will automatically populate in the footer of every quote you produce.
              </p>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Company Info
              </button>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white text-sm font-extrabold shadow-md shadow-[#0F766E]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Workspace...
                  </>
                ) : (
                  <>
                    Complete Setup & Launch <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

