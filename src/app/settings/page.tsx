"use client";

import { useQuotationState } from "@/hooks/useQuotationState";
import { BrandingPanel } from "@/components/builder/BrandingPanel";
import { PersonnelSection } from "@/components/builder/PersonnelSection";
import { TermsSection } from "@/components/builder/TermsSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Building2, Palette, FileText, LayoutGrid, Cpu, Plus, X, Eye, EyeOff, Check, Sparkles, Key, AlertCircle, ChevronDown, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableColumn } from "@/types/quotation.types";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface AccordionItemProps {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  toggleSwitch?: React.ReactNode;
  children: React.ReactNode;
}

function AccordionItem({ id, title, description, icon, isOpen, onToggle, badge, toggleSwitch, children }: AccordionItemProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
      {/* Header Button */}
      <div 
        className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <div className="text-primary shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs md:text-sm text-slate-800 uppercase tracking-wider">{title}</h3>
            {description && <p className="text-[10px] text-muted-foreground font-medium hidden sm:block mt-0.5">{description}</p>}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {toggleSwitch && <div className="shrink-0">{toggleSwitch}</div>}
          <button 
            onClick={onToggle}
            className={`w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all ${isOpen ? "rotate-180" : ""}`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[1200px] border-t border-slate-100" : "max-h-0"
        }`}
      >
        <div className="p-3 md:p-5 bg-slate-50/10">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { state, dispatch, isSaved } = useQuotationState();
  const { data: session } = useSession();
  const { success, error: toastError } = useToast();
  
  const [newColName, setNewColName] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      toastError("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      toastError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      toastError("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordSuccess("Password updated successfully!");
      success("Your password has been changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errMsg = err.message || "Failed to update password";
      setPasswordError(errMsg);
      toastError(errMsg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Fetch saved custom Gemini key if authenticated
  useEffect(() => {
    if (!session) return;
    
    const fetchUserSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.geminiApiKey) {
            setGeminiApiKey(data.geminiApiKey);
          }
        }
      } catch (err) {
        console.error("Failed to load custom API key settings", err);
      }
    };
    
    fetchUserSettings();
  }, [session]);

  const handleSaveApiKey = async () => {
    if (!session) return;
    setSavingKey(true);
    setKeySaveSuccess(false);
    
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey })
      });
      
      if (res.ok) {
        setKeySaveSuccess(true);
        success("Gemini API Key updated successfully!");
        setTimeout(() => setKeySaveSuccess(false), 5000);
      } else {
        throw new Error("Failed to save key");
      }
    } catch (err: any) {
      console.error("Failed to save custom Gemini key", err);
      toastError(err.message || "Failed to save Gemini API key.");
    } finally {
      setSavingKey(false);
    }
  };

  const handleUpdateBranding = (updates: any) => dispatch({ type: "SET_BRANDING", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const handleUpdateCompany = (updates: any) => dispatch({ type: "SET_COMPANY", payload: updates }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const handleUpdateTerms = (terms: string) => dispatch({ type: "SET_TERMS", payload: terms });
  const handleToggleSection = (section: keyof typeof state.builderConfig, value: boolean) =>
    dispatch({ type: "SET_BUILDER_CONFIG", payload: { [section]: value } });

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const key = newColName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const col: TableColumn = {
      id: `custom_${Date.now()}`,
      label: newColName.trim(),
      key,
      type: "text",
      visible: true,
      width: "100px",
    };
    dispatch({ type: "ADD_COLUMN", payload: col });
    setNewColName("");
  };

  const toggleAccordion = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const primaryColor = state.branding.primaryColor || "#2563eb";

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
      <header className="h-14 border-b bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-slate-600 rounded-full hover:bg-slate-100 shrink-0">
            <Link href="/">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Settings</h2>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Company & Builder Config</p>
            </div>
          </div>
        </div>
        {isSaved ? (
          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <Check className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Saved</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 animate-pulse">
            <span className="text-[10px] font-bold">Saving...</span>
          </div>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-xl mx-auto p-3 md:p-6 pb-20 md:pb-6 space-y-3 md:space-y-4">

          {/* 1. Visual Branding */}
          <AccordionItem
            id="branding"
            title="Visual Branding"
            description="Logo, corporate colors, and visual layouts"
            icon={<Palette className="w-4 h-4" />}
            isOpen={openSection === "branding"}
            onToggle={() => toggleAccordion("branding")}
            badge={
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                Always On
              </span>
            }
          >
            <BrandingPanel branding={state.branding} onUpdate={handleUpdateBranding} />
          </AccordionItem>

          {/* 2. Business Profile */}
          <AccordionItem
            id="company"
            title="Business Profile"
            description="Your company contact details and address"
            icon={<Building2 className="w-4 h-4" />}
            isOpen={openSection === "company"}
            onToggle={() => toggleAccordion("company")}
            toggleSwitch={
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Show</span>
                <Switch 
                  checked={state.builderConfig.showBusinessProfile} 
                  onCheckedChange={(v) => handleToggleSection("showBusinessProfile", v)} 
                  className="scale-[0.65]" 
                />
              </div>
            }
          >
            <div className={!state.builderConfig.showBusinessProfile ? "opacity-50 pointer-events-none" : ""}>
              <PersonnelSection company={state.company} client={state.client} onUpdateCompany={handleUpdateCompany} onUpdateClient={() => {}} hideClient={true} />
            </div>
          </AccordionItem>

          {/* 3. Machine Information */}
          <AccordionItem
            id="machine"
            title="Machine Information"
            description="Toggle engine make/model specs fields"
            icon={<Cpu className="w-4 h-4" />}
            isOpen={openSection === "machine"}
            onToggle={() => toggleAccordion("machine")}
            toggleSwitch={
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Show</span>
                <Switch 
                  checked={state.builderConfig.showMachineInfo} 
                  onCheckedChange={(v) => handleToggleSection("showMachineInfo", v)} 
                  className="scale-[0.65]" 
                />
              </div>
            }
          >
            <p className="text-xs text-muted-foreground">
              Vessel Name, Engine Make, and Model specification inputs will be <strong>{state.builderConfig.showMachineInfo ? "visible" : "hidden"}</strong> in the quotation document details.
            </p>
          </AccordionItem>

          {/* 4. Client Info */}
          <AccordionItem
            id="client"
            title="Client Info Section"
            description="Toggle buyer and recipient details"
            icon={<FileText className="w-4 h-4" />}
            isOpen={openSection === "client"}
            onToggle={() => toggleAccordion("client")}
            toggleSwitch={
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Show</span>
                <Switch 
                  checked={state.builderConfig.showClientInfo} 
                  onCheckedChange={(v) => handleToggleSection("showClientInfo", v)} 
                  className="scale-[0.65]" 
                />
              </div>
            }
          >
            <p className="text-xs text-muted-foreground">
              Customer Details, Buyer Company Name, and delivery contact forms will be <strong>{state.builderConfig.showClientInfo ? "visible" : "hidden"}</strong> in the builder.
            </p>
          </AccordionItem>

          {/* 5. Parts Table Column setup */}
          <AccordionItem
            id="table"
            title="Parts Table Columns"
            description="Add, rename, or toggle visibility of columns"
            icon={<LayoutGrid className="w-4 h-4" />}
            isOpen={openSection === "table"}
            onToggle={() => toggleAccordion("table")}
            toggleSwitch={
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Show</span>
                <Switch 
                  checked={state.builderConfig.showTable} 
                  onCheckedChange={(v) => handleToggleSection("showTable", v)} 
                  className="scale-[0.65]" 
                />
              </div>
            }
          >
            <div className={`space-y-4 ${!state.builderConfig.showTable ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="space-y-2">
                {state.tableColumns.map(col => (
                  <div key={col.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${col.visible ? "bg-white" : "bg-muted/30 opacity-60"}`}>
                    <button onClick={() => dispatch({ type: "UPDATE_COLUMN", payload: { id: col.id, updates: { visible: !col.visible } } })}>
                      {col.visible ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    <Input
                      value={col.label}
                      onChange={e => dispatch({ type: "UPDATE_COLUMN", payload: { id: col.id, updates: { label: e.target.value } } })}
                      className="h-7 text-xs font-semibold flex-1 border-none bg-transparent shadow-none focus-visible:ring-1"
                    />
                    <span className="text-[8px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">{col.type}</span>
                    {col.id.startsWith("custom_") && (
                      <button onClick={() => dispatch({ type: "DELETE_COLUMN", payload: col.id })} className="text-destructive hover:scale-110 transition-transform">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="New column name..."
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddColumn()}
                  className="h-8 text-xs flex-1"
                />
                <Button size="sm" variant="outline" onClick={handleAddColumn} className="h-8 text-xs gap-1 rounded-full">
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>
          </AccordionItem>

          {/* 6. AI Settings */}
          <AccordionItem
            id="ai"
            title="AI Integration Settings"
            description="Manage Gemini AI API tokens and features"
            icon={<Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />}
            isOpen={openSection === "ai"}
            onToggle={() => toggleAccordion("ai")}
          >
            {session ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="apiKeyInput" className="text-xs font-bold uppercase tracking-tight flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-primary" />
                    Custom Gemini API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKeyInput"
                      type="password"
                      placeholder="Paste your Gemini API Key here (starts with AIzaSy...)"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="h-9 text-xs flex-1 font-mono"
                    />
                    <Button
                      size="sm"
                      disabled={savingKey}
                      onClick={handleSaveApiKey}
                      className="h-9 text-xs font-bold rounded-full"
                    >
                      {savingKey ? "Saving..." : "Save Key"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Your custom key is saved securely in your PostgreSQL cloud profile and will be used to run all AI imports and description polishing.
                  </p>
                </div>
                {keySaveSuccess && (
                  <div className="p-2.5 text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-lg font-bold">
                    ✓ API Key successfully synchronized with your cloud database!
                  </div>
                )}

                {/* Gemini API Key step-by-step Guide */}
                <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 space-y-2.5 mt-2.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">Easy Guide: Get Your Free Gemini API Key</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">1</span>
                      <span>
                        Open the official{" "}
                        <a 
                          href="https://aistudio.google.com/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          Google AI Studio <span className="text-[9px]">↗</span>
                        </a>{" "}
                        website and log in with any Google / Gmail account.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">2</span>
                      <span>Click the blue <strong className="text-slate-800">"Get API key"</strong> button on the top-left corner of the sidebar dashboard.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">3</span>
                      <span>Click <strong className="text-slate-800">"Create API key"</strong>, choose/create a project, and copy the key string (starts with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9.5px]">AIzaSy...</code>).</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">4</span>
                      <span>Paste the key in the input box above and click <strong className="text-primary">"Save Key"</strong>. You are ready to start AI importing!</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50 text-[9.5px] text-slate-400 font-semibold uppercase tracking-tight">
                    💡 Note: Gemini 2.5 Flash features a very generous free tier with zero charge!
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                  <div className="flex gap-2 text-amber-800">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-500 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold">Premium B2B Cloud Integration Available</p>
                      <p className="text-[10px] text-amber-700 font-medium">
                        Sign in to sync your custom Gemini API keys, unlock B2B cloud database saves, and enjoy AI RFQ document imports directly!
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold rounded-full" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button size="sm" className="h-7 text-[10px] font-bold rounded-full" asChild>
                      <Link href="/register">Create Account</Link>
                    </Button>
                  </div>
                </div>

                {/* Gemini API Key Guide (Visible when logged out to help new users) */}
                <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">Easy Guide: Get Your Free Gemini API Key</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">1</span>
                      <span>
                        Open the official{" "}
                        <a 
                          href="https://aistudio.google.com/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          Google AI Studio <span className="text-[9px]">↗</span>
                        </a>{" "}
                        website and log in with any Google / Gmail account.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">2</span>
                      <span>Click the blue <strong className="text-slate-800">"Get API key"</strong> button on the top-left corner of the sidebar dashboard.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">3</span>
                      <span>Click <strong className="text-slate-800">"Create API key"</strong>, agree to standard terms, and copy the key (starts with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9.5px]">AIzaSy...</code>).</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[10.5px] text-slate-600 font-medium leading-relaxed">
                      <span className="w-4.5 h-4.5 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">4</span>
                      <span>Once logged in to QuoteCraft, save this key in your Settings to enable high-efficiency AI RFQ document imports immediately!</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50 text-[9.5px] text-slate-400 font-semibold uppercase tracking-tight">
                    💡 Note: Gemini 2.5 Flash features a very generous free tier with zero subscription costs!
                  </div>
                </div>
              </div>
            )}
          </AccordionItem>

          {/* 7. Default Terms */}
          <AccordionItem
            id="terms"
            title="Default Terms & Conditions"
            description="Your standard business payment and commercial rules"
            icon={<FileText className="w-4 h-4" />}
            isOpen={openSection === "terms"}
            onToggle={() => toggleAccordion("terms")}
            toggleSwitch={
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Show</span>
                <Switch 
                  checked={state.builderConfig.showTerms} 
                  onCheckedChange={(v) => handleToggleSection("showTerms", v)} 
                  className="scale-[0.65]" 
                />
              </div>
            }
          >
            <div className={!state.builderConfig.showTerms ? "opacity-50 pointer-events-none" : ""}>
              <TermsSection terms={state.terms} onUpdate={handleUpdateTerms} />
            </div>
          </AccordionItem>

          {/* 8. Change Password Section */}
          {session && (
            <AccordionItem
              id="change-password"
              title="Security & Password"
              description="Update your account access password"
              icon={<Key className="w-4 h-4 text-rose-500" />}
              isOpen={openSection === "change-password"}
              onToggle={() => toggleAccordion("change-password")}
            >
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="p-3 text-xs bg-green-50 text-green-700 border border-green-100 rounded-lg font-medium">
                    {passwordSuccess}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="oldPassword" className="text-xs font-bold uppercase tracking-tight">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-tight">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-tight">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updatingPassword}
                  className="h-9 text-xs font-bold rounded-full w-full sm:w-auto"
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </AccordionItem>
          )}

        </div>
      </ScrollArea>
    </main>
  );
}
