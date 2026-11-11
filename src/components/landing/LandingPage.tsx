"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { 
  UploadCloud, 
  FileCheck2, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Handshake,
  ArrowRight, 
  Play, 
  Check, 
  Bell, 
  TrendingUp, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Layers, 
  Settings, 
  LifeBuoy, 
  X, 
  Sparkles, 
  Palette,
  Clock,
  DollarSign,
  CheckCircle2,
  Globe,
  Users,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Star,
  MessageCircle,
  Building,
  Ship,
  Award,
  Shield,
  FileDown,
  Menu
} from "lucide-react";
import { QuoteCraftLogo, QuoteCraftAppIcon } from "@/components/ui/QuoteCraftLogo";
import { ContainerShipIllustration } from "@/components/ui/ContainerShipIllustration";

export function LandingPage() {
  const { isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showStyleguide, setShowStyleguide] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<number>(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E293B] flex flex-col font-sans selection:bg-[#0F766E]/15 selection:text-[#0F766E]">
      
      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center">
            <QuoteCraftLogo size={36} showTagline={false} />
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#475569]">
            <a href="#how-it-works" className="hover:text-[#0F766E] transition-colors">How it Works</a>
            <a href="#features" className="hover:text-[#0F766E] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#0F766E] transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-[#0F766E] transition-colors">Customers</a>
            <a href="#faq" className="hover:text-[#0F766E] transition-colors">FAQ</a>
          </nav>

          {/* Right Auth CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowStyleguide(true)}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] bg-[#E0F2F1] hover:bg-[#B2DFDB] px-3 py-1.5 rounded-md transition-all"
              title="Inspect Brand Design Principles & Palette"
            >
              <Palette className="w-3.5 h-3.5" />
              Design System
            </button>

            {isSignedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="text-sm font-bold text-[#475569] hover:text-[#0F766E] px-3 py-2 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0F766E]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Quote <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="text-sm font-bold text-[#475569] hover:text-[#0F766E] px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0F766E]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-900" />
              ) : (
                <Menu className="w-6 h-6 text-slate-900" />
              )}
            </button>
          </div>
        </div>

        {/* ── MOBILE SLIDE-DOWN DRAWER ── */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#ECE7DE] px-5 pt-3 pb-6 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2 text-sm font-bold text-[#475569]">
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[#0F766E] transition-colors"
              >
                How it Works
              </a>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[#0F766E] transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[#0F766E] transition-colors"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[#0F766E] transition-colors"
              >
                Customers
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[#0F766E] transition-colors"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0D6B63] transition-colors shadow-sm"
                  >
                    Create Quotation
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0D6B63] transition-colors shadow-sm"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
        {/* Ocean Horizon & Sunrise Sky Ambience */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Golden Dawn Sky Gradient */}
          <div className="absolute top-0 left-0 right-0 h-[520px] bg-gradient-to-b from-[#FFFBEB]/70 via-[#F3EFE6]/50 to-transparent" />
          
          {/* Subtle Ocean Horizon Line with Container Ship Silhouette */}
          <div className="absolute top-20 right-0 w-[55%] max-w-[850px] opacity-40 lg:opacity-75 transition-opacity">
            <ContainerShipIllustration variant="banner" className="w-full h-auto drop-shadow-sm" />
          </div>

          {/* Warm Sun Glow Orb */}
          <div className="absolute top-4 right-[25%] w-[420px] h-[420px] bg-gradient-to-br from-[#F59E0B]/15 via-[#FFFBEB]/30 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Headlines, Subhead, Badges & CTAs */}
            <div className="lg:col-span-5 space-y-6">
              {/* Badge: Smart Quotation Solution */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-bold tracking-tight shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                Smart Quotation Solution
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-[#0F172A] tracking-tight leading-[1.12]">
                From Enquiry to<br />
                Quotation, <span className="text-[#F59E0B]">Faster.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-[#475569] font-medium leading-relaxed max-w-md">
                A modern solution for marine suppliers and industrial traders to parse messy buyer RFQs and output beautiful commercial PDFs in 3 minutes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  href={isSignedIn ? "/dashboard" : "/sign-up"}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#0F766E] hover:bg-[#0D6B63] text-white text-sm font-bold shadow-lg shadow-[#0F766E]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSignedIn ? "Go to Dashboard" : "Start Free Trial"} <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-[#334155] text-sm font-bold border border-slate-300/80 shadow-xs transition-colors"
                >
                  <Play className="w-4 h-4 fill-[#0F766E] text-[#0F766E]" />
                  Watch Demo
                </button>
              </div>

              {/* Privacy Guarantee Reassurance */}
              <p className="text-xs text-[#64748B] flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                No credit card required &bull; Customer RFQ files &amp; pricing stay private to your account
              </p>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-[#ECE7DE] flex flex-wrap items-center gap-6 text-xs font-bold text-[#475569]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  Secure & Reliable
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  Save Time
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center">
                    <Handshake className="w-3.5 h-3.5" />
                  </div>
                  Grow Your Business
                </div>
              </div>
            </div>

            {/* Right Column: 3D Perspective Floating Dashboard Mockup */}
            <div className="lg:col-span-7 relative">
              <div 
                className="relative rounded-lg transition-transform duration-300 hover:scale-[1.01]"
                style={{ perspective: "1200px" }}
              >
                <div 
                  className="bg-white rounded-lg border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col md:flex-row"
                  style={{
                    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.8)",
                  }}
                >
                  {/* Left Dark Teal Mini Sidebar (Desktop Only) */}
                  <div className="hidden md:flex flex-col w-44 bg-[#041E26] text-white p-4 justify-between shrink-0 border-r border-[#0A333C]">
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <QuoteCraftLogo size={24} variant="dark" showText={false} />
                        <span className="text-xs font-extrabold tracking-tight">QuoteCraft</span>
                      </div>

                      <nav className="space-y-1 text-xs font-semibold text-slate-300">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0F766E] text-white font-bold">
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#F59E0B]" />
                          Dashboard
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          My Quotations
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          Templates
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300">
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          Settings
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-slate-300">
                          <LifeBuoy className="w-3.5 h-3.5 text-slate-400" />
                          Help & Support
                        </div>
                      </nav>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#0D3845] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        CD
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">Captain Dale</p>
                        <p className="text-xs text-teal-300 truncate">Marine Supplies</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Main Mockup Dashboard Area */}
                  <div className="flex-1 p-4 sm:p-5 space-y-4 bg-white">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-[#0F172A] tracking-tight">
                          Welcome back, John! 👋
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Here&apos;s what&apos;s happening with your quotations.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center">
                          JD
                        </div>
                      </div>
                    </div>

                    {/* 4 Stat Cards in 2x2 on Mobile, 4 Cols on Desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-[#FAF9F5] p-2 sm:p-2.5 rounded-xl border border-slate-100 text-left">
                        <p className="text-xs text-slate-400 font-medium">Total Quotations</p>
                        <p className="text-xs sm:text-sm font-black text-[#0F172A] mt-0.5">12</p>
                      </div>
                      <div className="bg-[#FAF9F5] p-2 sm:p-2.5 rounded-xl border border-slate-100 text-left">
                        <p className="text-xs text-slate-400 font-medium">This Month</p>
                        <p className="text-xs sm:text-sm font-black text-[#0F766E] mt-0.5">8</p>
                      </div>
                      <div className="bg-[#FAF9F5] p-2 sm:p-2.5 rounded-xl border border-slate-100 text-left">
                        <p className="text-xs text-slate-400 font-medium">RFQs Processed</p>
                        <p className="text-xs sm:text-sm font-black text-[#0F172A] mt-0.5">125</p>
                      </div>
                      <div className="bg-[#E0F2F1]/50 p-2 sm:p-2.5 rounded-xl border border-[#0F766E]/20 text-left">
                        <p className="text-xs text-[#0F766E] font-medium">Growth</p>
                        <p className="text-xs sm:text-sm font-black text-[#16A34A] mt-0.5 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3 stroke-[2.5]" /> 20%
                        </p>
                      </div>
                    </div>

                    {/* Upload Box + Recent Quotations */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                      <div className="sm:col-span-7 border-2 border-dashed border-[#0F766E]/30 bg-[#E0F2F1]/20 rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-white text-[#0F766E] shadow-xs flex items-center justify-center">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">Upload Customer Request</p>
                          <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-0.5">
                            Drag & drop your file or click to browse. Supports PDF, Excel (.xlsx, .xls)
                          </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#0F766E] text-white shadow-2xs">
                          Choose File
                        </span>
                      </div>

                      <div className="sm:col-span-5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800">Recent Quotations</p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-mono font-bold text-slate-900 leading-none">QT-1075</p>
                              <p className="text-xs text-slate-400 mt-0.5">03 Nov 2026</p>
                            </div>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Sent &gt;
                            </span>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-mono font-bold text-slate-900 leading-none">QT-1074</p>
                              <p className="text-xs text-slate-400 mt-0.5">01 Nov 2026</p>
                            </div>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Draft &gt;
                            </span>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-mono font-bold text-slate-900 leading-none">QT-1073</p>
                              <p className="text-xs text-slate-400 mt-0.5">28 Oct 2026</p>
                            </div>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Sent &gt;
                            </span>
                          </div>
                        </div>

                        <div className="text-right pt-0.5">
                          <span className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer">
                            View All &gt;
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WORKFLOW / HOW IT WORKS: 4-STEP CARDS + INTERACTIVE STEPPER ── */}
      <section id="how-it-works" className="py-20 bg-white border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E0F2F1] text-[#0F766E] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              End-to-End Maritime Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Everything you need to quote <span className="text-[#F59E0B]">faster.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#475569] font-medium">
              Simple. Powerful. Built specifically for marine suppliers and industrial procurement.
            </p>
          </div>

          {/* 3 Process Cards matching 3-step marine workflow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div 
              onClick={() => setActiveWorkflowTab(1)}
              className={`rounded-lg border p-6 flex flex-col items-center text-center space-y-3.5 transition-all cursor-pointer group ${
                activeWorkflowTab === 1 
                  ? "bg-[#FAF9F5] border-[#0F766E] shadow-md ring-2 ring-[#0F766E]/20" 
                  : "bg-[#FAF9F5] border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="w-14 h-14 rounded-lg bg-white text-[#0F766E] border border-slate-200 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-black text-base text-[#0F172A]">1. Customer&apos;s Request</h3>
                <p className="text-xs font-bold text-[#64748B]">Upload File or Paste Text</p>
                <p className="text-xs text-slate-500 pt-1">
                  Drag and drop customer requisitions or paste raw email RFQ text with zero manual typing.
                </p>
              </div>
            </div>

            <div 
              onClick={() => setActiveWorkflowTab(2)}
              className={`rounded-lg border p-6 flex flex-col items-center text-center space-y-3.5 transition-all cursor-pointer group ${
                activeWorkflowTab === 2 
                  ? "bg-[#FAF9F5] border-[#0F766E] shadow-md ring-2 ring-[#0F766E]/20" 
                  : "bg-[#FAF9F5] border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="w-14 h-14 rounded-lg bg-white text-[#0F766E] border border-slate-200 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-black text-base text-[#0F172A]">2. Check Items</h3>
                <p className="text-xs font-bold text-[#64748B]">AI Review &amp; Inline Edit</p>
                <p className="text-xs text-slate-500 pt-1">
                  Instant item extraction, clear trust banners, IMPA code checks, and Excel-style inline editing.
                </p>
              </div>
            </div>

            <div 
              onClick={() => setActiveWorkflowTab(3)}
              className={`rounded-lg border p-6 flex flex-col items-center text-center space-y-3.5 transition-all cursor-pointer group ${
                activeWorkflowTab === 3 
                  ? "bg-[#FAF9F5] border-[#0F766E] shadow-md ring-2 ring-[#0F766E]/20" 
                  : "bg-[#FAF9F5] border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="w-14 h-14 rounded-lg bg-white text-[#0F766E] border border-slate-200 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calculator className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-black text-base text-[#0F172A]">3. Add Prices &amp; Send</h3>
                <p className="text-xs font-bold text-[#64748B]">Spreadsheet, PDF &amp; WhatsApp</p>
                <p className="text-xs text-slate-500 pt-1">
                  Excel column paste, sticky grand totals, live vector PDF preview, and 1-click WhatsApp dispatch.
                </p>
              </div>
            </div>

          </div>

          {/* Interactive Deep-Dive Workflow Showcase */}
          <div className="rounded-lg bg-[#FAF9F5] border border-slate-200/90 p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono font-bold text-[#F59E0B] tracking-wider uppercase">
                  Step 0{activeWorkflowTab} of 03
                </span>

                {activeWorkflowTab === 1 && (
                  <>
                    <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                      Drop In Inquiries From Any Format
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Whether your customer sends an Excel sheet, scanned PDF requisition from the Chief Engineer, or pastes unstructured email text, QuoteCraft parses line items and vessel details automatically.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Multi-format Excel (.xlsx, .xls, .csv), PDF &amp; Raw Text tabs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Automatic vessel name &amp; buyer ref extraction
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> 1-Click sample marine request for instant zero-friction testing
                      </li>
                    </ul>
                  </>
                )}

                {activeWorkflowTab === 2 && (
                  <>
                    <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                      Trust Banner &amp; Discrepancy Detection
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Instant trust summary (&ldquo;We found 24 items, 1 needs check&rdquo;) with direct jump-to-check button, missing quantity flags, and Excel-style inline cell editing.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Instant trust banner showing items parsed vs. needing check
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Inline cell editing with Tab/Enter keyboard navigation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Full Ctrl+Z undo history for mistake-free editing
                      </li>
                    </ul>
                  </>
                )}

                {activeWorkflowTab === 3 && (
                  <>
                    <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                      Spreadsheet Pricing, Live PDF &amp; WhatsApp
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Paste price columns directly from Excel sheets or supplier lists. Watch live calculations update in the sticky bottom total bar, preview vector A4 PDFs in real time, and dispatch directly to buyer WhatsApp.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Excel column clipboard paste for rapid multi-line pricing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Live interactive PDF preview with 4 marine corporate layouts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> 1-Click WhatsApp commercial dispatch &amp; 3-day follow-up reminder
                      </li>
                    </ul>
                  </>
                )}

                <div className="pt-2">
                  <Link
                    href={isSignedIn ? "/" : "/sign-up"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold transition-all shadow-md shadow-[#0F766E]/20"
                  >
                    {isSignedIn ? "Launch Workflow Now" : "Try This Workflow Now"} <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Right Mockup Display for Active Step */}
              <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200/90 p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-slate-400 ml-2">QuoteCraft Workflow Engine</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#E0F2F1] text-[#0F766E] px-2 py-0.5 rounded-md">
                    Live Demo View
                  </span>
                </div>

                {activeWorkflowTab === 1 && (
                  <div className="border-2 border-dashed border-[#0F766E]/30 bg-[#E0F2F1]/10 rounded-lg p-8 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-[#E0F2F1] text-[#0F766E] mx-auto flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">M/V Oceanic Star Requisition.xlsx</p>
                      <p className="text-xs text-slate-400 mt-0.5">24 line items extracted in 1.4 seconds</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <Check className="w-3 h-3" /> Ready for commercial pricing
                    </div>
                  </div>
                )}

                {activeWorkflowTab === 2 && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">Main Engine Cylinder Liner (CL-102)</p>
                        <p className="text-xs text-slate-500 font-mono">Bore 500mm, High-tensile cast iron</p>
                      </div>
                      <span className="font-bold text-slate-800">4 PCS</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">Fuel Injector Nozzle Assembly</p>
                        <p className="text-xs text-amber-700 font-semibold">⚠️ Needs review: Confirm nozzle opening pressure (380 bar)</p>
                      </div>
                      <span className="font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">Verified</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">Exhaust Valve Spindle (EV-204)</p>
                        <p className="text-xs text-slate-500 font-mono">Nimonic material, Hard chrome stem</p>
                      </div>
                      <span className="font-bold text-slate-800">8 PCS</span>
                    </div>
                  </div>
                )}

                {activeWorkflowTab === 3 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-400">Subtotal</span>
                        <p className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">$8,450.00</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-400">Discount (5%)</span>
                        <p className="font-mono tabular-nums font-bold text-rose-600 mt-0.5">-$422.50</p>
                      </div>
                      <div className="bg-[#E0F2F1]/50 p-2.5 rounded-xl border border-[#0F766E]/20">
                        <span className="text-xs text-[#0F766E] font-bold">Grand Total</span>
                        <p className="font-mono tabular-nums font-black text-[#0F766E] mt-0.5">$8,027.50</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">QT-1075_AURA_MARINE.pdf</p>
                          <p className="text-xs text-slate-400">A4 Vector Document &bull; Marine Layout</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0F766E] text-white">
                        Live Preview
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold">WhatsApp Quote message generated &amp; ready to dispatch</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 shrink-0">1 Click</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── WHY MARINE SUPPLIERS SWITCH (COMPARISON TABLE) ── */}
      <section className="py-20 bg-[#FAF9F5] border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Why marine chandlers switch to QuoteCraft
            </h2>
            <p className="text-sm sm:text-base text-[#475569] font-medium">
              Vessels have tight port turnarounds. The first supplier with an accurate, professional quote wins the order.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              
              {/* Old Excel Way */}
              <div className="p-8 space-y-5 bg-slate-50/50">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">The Old Way</span>
                  <h3 className="text-xl font-bold text-slate-800">Manual Excel & Word Quoting</h3>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                    45–60 minutes per inquiry copying part numbers manually
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                    Broken Excel formulas causing costly pricing under-quotes
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                    Unformatted PDFs with broken page boundaries & single-letter wrapping
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                    Slow response times cause competitor chandlers to win the vessel deal
                  </li>
                </ul>
              </div>

              {/* QuoteCraft Way */}
              <div className="p-8 space-y-5 bg-gradient-to-b from-[#E0F2F1]/20 to-white">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                    The QuoteCraft Way
                  </span>
                  <h3 className="text-xl font-black text-[#0F172A]">AI-Assisted Maritime Procurement</h3>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-700 font-bold">
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#0F766E] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    Under 3 minutes to parse RFQs and generate final commercial quotes
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#0F766E] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    Automated line totals, bulk margins, multi-currency & tax integrity
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#0F766E] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    4 Print-ready vector A4 templates with logo & bank details
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#0F766E] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    Instant WhatsApp quote dispatch to procurement officers & port agents
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── CORE SAAS FEATURES GRID ── */}
      <section id="features" className="py-20 bg-white border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Engineered for Global Ship Supplies
            </h2>
            <p className="text-sm sm:text-base text-[#475569] font-medium">
              Every feature designed with feedback from ship chandlers, bunker suppliers, and engine parts exporters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">AI RFQ Table Extraction</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Ingest multi-tab Excel files, messy scanned PDFs, and emails. Item descriptions, part numbers, and quantities populate with zero retyping.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center font-bold">
                <Ship className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Vessel &amp; Machinery Details</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Track vessel name, IMO/port, equipment make/model, and technical specifications automatically bound to every quotation header.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Multi-Currency Margins</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Seamlessly trade across USD, EUR, GBP, AED, SGD, and INR with granular line-item markups, trade discounts, and maritime VAT rules.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">4 PDF Layout Templates</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Choose between Marine Professional, Modern Minimal (Anvil layout), Classic Centered Banner, and High-Density Technical Chandlery.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#0F766E] flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Instant WhatsApp Sharing</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Launch pre-formatted quotation summaries straight to buyers, port captains, and chief engineers with attached PDF downloads.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Bank & Payment Security</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Set up your company letterhead, SWIFT/IBAN banking credentials, and delivery terms once in Settings. Reused across every generated PDF.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── SAAS PRICING PLANS ── */}
      <section id="pricing" className="py-20 bg-[#FAF9F5] border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Release Candidate: Full Professional Access Unlocked
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-sm sm:text-base text-[#475569] font-medium max-w-2xl mx-auto">
              QuoteCraft is currently in open Release Candidate. All professional capabilities—including unlimited AI RFQ extractions, all 4 corporate templates, and custom branding—are 100% complimentary with no credit card required.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-200/80 border border-slate-300/80 mt-2">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly Reference
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Annual Reference
                <span className="text-xs bg-[#F59E0B] text-slate-900 px-2 py-0.5 rounded-full font-extrabold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* Plan 1: Free Trial / Starter */}
            <div className="bg-white rounded-lg border border-slate-200/90 p-8 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#0F172A]">Starter Chandlery</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Perfect for independent marine brokers and single ship suppliers.
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-mono text-slate-900">$0</span>
                  <span className="text-xs text-emerald-700 font-bold ml-1">Free Forever</span>
                </div>

                <ul className="space-y-3 text-xs font-medium text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> Up to 15 Quotations / Month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> AI RFQ PDF & Excel Ingestion
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> Marine Standard & Minimal PDF
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> WhatsApp Quote Export
                  </li>
                </ul>
              </div>

              <Link
                href={isSignedIn ? "/?new=true" : "/sign-up"}
                className="w-full py-3 rounded-lg text-center font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                {isSignedIn ? "Start Quotation →" : "Get Started Free"}
              </Link>
            </div>

            {/* Plan 2: Pro Supplier (Featured / Most Popular) */}
            <div className="bg-white rounded-lg border-2 border-[#0F766E] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative lg:scale-[1.02]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#F59E0B] text-slate-900 text-xs font-black uppercase tracking-wider shadow-sm">
                Unlocked in Release Candidate
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#0F172A]">Professional Supplier</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    For active marine trading desks, chandlers, and spare part distributors.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-slate-900">$0</span>
                  <span className="text-xs line-through text-slate-400 font-bold">
                    ${billingCycle === "annual" ? "64" : "79"}/mo
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                    Free during RC
                  </span>
                </div>

                <ul className="space-y-3 text-xs font-bold text-slate-800 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Unlimited Quotations & RFQs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> All 4 Corporate Templates (Classic, Minimal, Marine, Technical)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Custom Corporate Brand Color Palette & Fonts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> High-Volume 50+ Item Ledger Support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Ultra-Fast Groq AI Extraction Engine
                  </li>
                </ul>
              </div>

              <Link
                href={isSignedIn ? "/?new=true" : "/sign-up"}
                className="w-full py-3.5 rounded-lg text-center font-bold text-xs bg-[#0F766E] hover:bg-[#0D6B63] text-white shadow-lg shadow-[#0F766E]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSignedIn ? "Create Quotation (Full Access) →" : "Get Started Free (No Card Needed) →"}
              </Link>
            </div>

            {/* Plan 3: Enterprise Fleet */}
            <div className="bg-white rounded-lg border border-slate-200/90 p-8 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#0F172A]">Enterprise Fleet</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    For multi-port suppliers, chandlery agencies, and ship owning groups.
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-slate-900">Custom</span>
                  <span className="text-xs text-slate-400 font-semibold">/ high-volume</span>
                </div>

                <ul className="space-y-3 text-xs font-medium text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> Multi-User Team Accounts & Roles
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> Custom ERP & Accounting Integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> Dedicated Account Manager & SLA
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" /> Custom Letterhead & Contract Terms Setup
                  </li>
                </ul>
              </div>

              <a
                href="mailto:sales@quotecraft.app?subject=QuoteCraft%20Enterprise%20Inquiry"
                className="w-full py-3 rounded-lg text-center font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                Contact Enterprise Sales
              </a>
            </div>

          </div>

          {/* Billing Preview & RC Footnote */}
          <div className="text-center max-w-2xl mx-auto pt-2 text-xs text-slate-500 font-medium bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5">
            ⚓ <strong>Commercial Billing Notice:</strong> Payment gateway and subscription checkout are currently in private preview. Every registered supplier account enjoys full, complimentary access to our complete feature suite during this Release Candidate phase. Commercial billing will be announced with 30-day advance notice.
          </div>

        </div>
      </section>

      {/* ── CUSTOMER TESTIMONIALS (GLOBAL PORTS) ── */}
      <section id="testimonials" className="py-20 bg-white border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFBEB] text-[#B45309] text-xs font-bold border border-[#FDE68A]">
              <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              Loved by Marine Traders Worldwide
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Trusted by Suppliers Across 40+ Ports
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;We handle 50+ vessel enquiries every week across Singapore anchorage. QuoteCraft cut our quote turnaround from 1 hour to 3 minutes. The AI extraction handles messy Excel tables flawlessly.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-xs font-bold text-slate-900">Marcus Tan</p>
                <p className="text-xs text-slate-500">Managing Director &bull; Singapore Marine Chandlers</p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;The WhatsApp quote sharing changed our sales speed. We send quotes to vessel managers directly while competitors are still formatting Word documents. Our order conversion rate jumped 28%.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-xs font-bold text-slate-900">Tariq Al-Mansoor</p>
                <p className="text-xs text-slate-500">Senior Broker &bull; Dubai Port Marine Equipment</p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF9F5] border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Having the Anvil and Classic templates built-in gives our quotations a Fortune-500 presentation. Customers regularly praise how readable and clear our spare parts lists look.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-xs font-bold text-slate-900">Jan De Vries</p>
                <p className="text-xs text-slate-500">Procurement Lead &bull; Rotterdam Marine Spares B.V.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS (ACCORDION) ── */}
      <section id="faq" className="py-20 bg-[#FAF9F5] border-t border-[#ECE7DE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500">
              Everything you need to know about QuoteCraft and maritime quotation workflows.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Can I upload messy Excel or scanned PDF customer RFQs?",
                a: "Yes. QuoteCraft's high-speed AI extraction engine is trained on maritime requisition terminology. It extracts part names, serial numbers, units, and quantities from irregular spreadsheets, digital PDFs, and document images."
              },
              {
                q: "Where do I configure our company logo, color palette, and document font?",
                a: "Template layout format, corporate color palettes (including official Teal & Gold or custom hex codes), document fonts (Manrope, Inter, Roboto), company letterhead, and bank details are configured permanently in Settings. They automatically format all future quotations."
              },
              {
                q: "Can I quote in multiple currencies like USD, EUR, or AED?",
                a: "Absolutely. QuoteCraft supports USD ($), EUR (€), GBP (£), AED, INR (₹), SGD (S$), and JPY (¥). You can adjust tax percentages, add trade discounts, and input shipping or launch delivery charges."
              },
              {
                q: "How does 1-click WhatsApp quote sharing work?",
                a: "In Step 3, clicking 'Share on WhatsApp' formats a concise commercial message with quote reference, vessel name, line count, and grand total, opening directly into WhatsApp Web or mobile ready to send to your buyer."
              },
              {
                q: "Is our commercial quotation data kept private and confidential?",
                a: "Yes. All quotation records, buyer names, and pricing markups are strictly isolated to your authenticated account with enterprise-grade encryption. We never share or sell supplier pricing data."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-[#0F766E] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#0F766E] shrink-0 ml-3" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-3" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── BOTTOM CALLOUT BANNER ── */}
      <section className="py-16 bg-[#FAF9F5] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="relative rounded-lg bg-white border border-slate-200/90 p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
            
            <div className="w-full md:w-5/12 max-w-sm shrink-0">
              <ContainerShipIllustration variant="banner" className="w-full h-auto" />
            </div>

            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Trusted by Marine & Industrial Businesses
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed max-w-lg">
                From ship chandlers to global industrial exporters, QuoteCraft helps marine suppliers work smarter.
              </p>
            </div>

            <div className="shrink-0 relative z-10">
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#0F766E] hover:bg-[#0D6B63] text-white text-sm font-bold shadow-lg shadow-[#0F766E]/25 transition-all hover:scale-105 active:scale-95"
              >
                {isSignedIn ? "Open Dashboard" : "Get Started Free"} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <svg
              className="absolute -bottom-2 -right-2 w-48 h-32 pointer-events-none opacity-80"
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M40 120 C 80 80, 140 110, 200 40 L 200 120 Z" fill="#0F766E" />
              <path d="M80 120 C 120 90, 160 110, 200 70 L 200 120 Z" fill="#F59E0B" opacity="0.9" />
              <path d="M120 120 C 150 100, 175 112, 200 95 L 200 120 Z" fill="#FFFBEB" opacity="0.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 bg-white border-t border-[#ECE7DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <QuoteCraftLogo size={32} showTagline={true} />
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-500">
              <a href="#how-it-works" className="hover:text-[#0F766E]">How it Works</a>
              <a href="#features" className="hover:text-[#0F766E]">Features</a>
              <a href="#pricing" className="hover:text-[#0F766E]">Pricing</a>
              <a href="#testimonials" className="hover:text-[#0F766E]">Customers</a>
              <a href="#faq" className="hover:text-[#0F766E]">FAQ</a>
              <button
                onClick={() => setShowStyleguide(true)}
                className="text-[#0F766E] font-bold hover:underline"
              >
                Design System
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
            <p>&copy; {new Date().getFullYear()} QuoteCraft. Built for Marine Suppliers & Industrial Traders.</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-slate-600">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
              <a href="mailto:support@quotecraft.app" className="hover:text-slate-600">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── WATCH DEMO VIDEO / INTERACTIVE WALKTHROUGH MODAL ── */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-[#0F766E] text-[#0F766E]" />
                <h3 className="font-extrabold text-base text-slate-900">QuoteCraft 2-Minute Guided Tour</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-gradient-to-br from-[#041E26] to-[#0A333C] rounded-lg flex flex-col items-center justify-center p-6 text-center text-white space-y-3 relative overflow-hidden shadow-inner">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                <Play className="w-8 h-8 fill-[#F59E0B] text-[#F59E0B] ml-1" />
              </div>
              <p className="text-sm font-bold">Watch QuoteCraft Process a Real 30-Item Marine Engine RFQ</p>
              <p className="text-xs text-teal-200 max-w-sm">
                From drag-and-drop Excel upload to vector PDF download and WhatsApp export.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-medium">No credit card or setup needed to try live.</span>
              <Link
                href="/sign-up"
                onClick={() => setShowDemoModal(false)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D6B63] text-white text-xs font-bold"
              >
                Start Free Trial Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── DESIGN PRINCIPLES & STYLEGUIDE MODAL ── */}
      {showStyleguide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <QuoteCraftLogo size={36} showTagline={true} />
              </div>
              <button
                onClick={() => setShowStyleguide(false)}
                className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Official Color Palette
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="space-y-1.5">
                  <div className="h-14 rounded-lg bg-[#0F766E] shadow-sm flex items-end p-2 text-white text-xs font-mono font-bold">
                    #0F766E
                  </div>
                  <p className="text-xs font-bold text-slate-900">Deep Teal</p>
                  <p className="text-xs text-slate-400">Primary Brand</p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-14 rounded-lg bg-[#F59E0B] shadow-sm flex items-end p-2 text-white text-xs font-mono font-bold">
                    #F59E0B
                  </div>
                  <p className="text-xs font-bold text-slate-900">Gold</p>
                  <p className="text-xs text-slate-400">Accent & Action</p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-14 rounded-lg bg-[#FFFBEB] border border-amber-200 shadow-sm flex items-end p-2 text-amber-900 text-xs font-mono font-bold">
                    #FFFBEB
                  </div>
                  <p className="text-xs font-bold text-slate-900">Cream</p>
                  <p className="text-xs text-slate-400">Warm Surface</p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-14 rounded-lg bg-[#475569] shadow-sm flex items-end p-2 text-white text-xs font-mono font-bold">
                    #475569
                  </div>
                  <p className="text-xs font-bold text-slate-900">Slate</p>
                  <p className="text-xs text-slate-400">Body Typography</p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-14 rounded-lg bg-[#E0F2F1] border border-teal-200 shadow-sm flex items-end p-2 text-[#0F766E] text-xs font-mono font-bold">
                    #E0F2F1
                  </div>
                  <p className="text-xs font-bold text-slate-900">Light Teal</p>
                  <p className="text-xs text-slate-400">Container Glow</p>
                </div>

                <div className="space-y-1.5">
                  <div className="h-14 rounded-lg bg-[#16A34A] shadow-sm flex items-end p-2 text-white text-xs font-mono font-bold">
                    #16A34A
                  </div>
                  <p className="text-xs font-bold text-slate-900">Success</p>
                  <p className="text-xs text-slate-400">Approved Status</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Typography
                </h3>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-4">
                  <span className="text-4xl font-extrabold text-slate-900">Aa</span>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">Manrope</h4>
                    <p className="text-xs text-slate-500 font-medium">Regular • Medium • Semibold • Bold</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Design Principles
                </h3>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="w-4 h-4 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    Clean & Professional
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="w-4 h-4 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    Simple & Focused
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="w-4 h-4 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    Modern & Trustworthy
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="w-4 h-4 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    Marine Inspired
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Official App Icons
              </h3>
              <div className="flex items-center gap-4">
                <QuoteCraftAppIcon variant="teal" size={56} />
                <QuoteCraftAppIcon variant="white" size={56} />
                <div className="text-xs text-slate-500 font-medium">
                  <p className="font-bold text-slate-800">Square Rounded 16px</p>
                  <p>Teal & Gold Maritime insignia for browser favicon, desktop & mobile PWA app icons.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
