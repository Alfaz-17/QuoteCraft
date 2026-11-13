"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Settings, 
  LogOut, 
  LifeBuoy,
  ChevronRight,
  PlusCircle,
  Globe,
  ShieldCheck,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    mobileLabel: "Home",
  },
  {
    name: "New Quotation",
    href: "/?new=true",
    icon: PlusCircle,
    mobileLabel: "New Quote",
  },
  {
    name: "My Quotations",
    href: "/quotations",
    icon: FileText,
    mobileLabel: "Quotes",
  },
  {
    name: "Templates",
    href: "/templates",
    icon: Layers,
    mobileLabel: "Templates",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    mobileLabel: "Settings",
  },
  {
    name: "Product Tour",
    href: "/landing",
    icon: Globe,
    mobileLabel: "Tour",
  },
  {
    name: "Help & Support",
    href: "mailto:support@quotecraft.app?subject=QuoteCraft%20Support%20Request",
    icon: LifeBuoy,
    mobileLabel: "Help",
    isExternal: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Don't render sidebar if not authenticated
  // Pages where Sidebar and Mobile Bottom Navigation must NEVER be rendered:
  // Onboarding (Company Setup) requires a focused, full-screen distraction-free wizard.
  // Marketing landing, auth pages, and admin areas must never show application sidebar navigation.
  const isExcludedPath =
    pathname?.startsWith("/admin") ||
    pathname === "/onboarding" ||
    pathname === "/landing" ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register");

  if (isExcludedPath) return null;
  if (!isLoaded || !isSignedIn) return null;

  const displayName = user?.fullName || user?.firstName || user?.username || "Marine Supplier";
  const userInitial = displayName.charAt(0).toUpperCase() || "M";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const isOwner = userEmail.toLowerCase() === "alfazbilakhiya17@gmail.com";
  const userRole = isOwner ? "Platform Founder" : "Marine Supplier";

  return (
    <>
      {/* Desktop Sidebar: Deep Brand Theme (#001E28 / #06232E) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#041E26] text-slate-200 h-screen sticky top-0 shrink-0 z-30 select-none border-r border-[#0D3845]">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#0D3845]/70">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <QuoteCraftLogo size={34} variant="dark" showTagline />
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Component = item.isExternal ? "a" : Link;
            return (
              <Component
                key={item.name}
                href={item.href}
                {...(item.isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[42px]",
                  isActive
                    ? "bg-[#0F766E] text-white shadow-md shadow-[#0F766E]/40 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-[#082E3A]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-[#F59E0B]" : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-200 shrink-0" />}
              </Component>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-[#0D3845]/80 mt-auto bg-[#021319]">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#041E26] border border-[#0D3845]">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-teal-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-inner">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-teal-300 font-medium truncate">
                  {userRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile primary navigation. The builder keeps its own action footer clear. */}
      {pathname !== "/" && (
        <>
          {isMoreOpen && (
            <>
              <button
                type="button"
                aria-label="Close more navigation"
                onClick={() => setIsMoreOpen(false)}
                className="md:hidden fixed inset-0 z-40 bg-slate-950/30"
              />
              <section
                id="more-navigation"
                aria-label="More destinations"
                className="md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-in slide-in-from-bottom-2 fade-in"
              >
                <div className="flex items-center justify-between px-2 pb-2">
                  <h2 className="text-sm font-bold text-slate-900">More</h2>
                  <button type="button" onClick={() => setIsMoreOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 min-h-[40px]">Close</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {menuItems.filter((item) => ["Templates", "Product Tour", "Help & Support"].includes(item.name)).map((item) => {
                    const Component = item.isExternal ? "a" : Link;
                    return (
                      <Component
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        {...(item.isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="flex min-h-12 items-center gap-2.5 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-teal-700" />
                        {item.name}
                      </Component>
                    );
                  })}
                </div>
              </section>
            </>
          )}
          <nav
            aria-label="Mobile Navigation"
            className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around"
          >
            {menuItems.filter((item) => ["Dashboard", "New Quotation", "My Quotations"].includes(item.name)).map((item) => {
              const isActive = pathname === item.href || (item.name === "New Quotation" && pathname === "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn("flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-1.5 transition-colors", isActive ? "font-bold text-[#0F766E]" : "text-[#475569] hover:text-[#0F172A]")}
                >
                  <span className={cn("mb-0.5 flex h-7 w-7 items-center justify-center rounded-lg", isActive && "bg-[#E0F2F1]")}> <item.icon className="h-4 w-4" /> </span>
                  <span className="text-[11px] font-semibold leading-none">{item.mobileLabel === "New Quote" ? "New" : item.mobileLabel}</span>
                </Link>
              );
            })}
            <Link href="/settings" className={cn("flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-1.5 transition-colors", pathname === "/settings" ? "font-bold text-[#0F766E]" : "text-[#475569] hover:text-[#0F172A]")}>
              <span className={cn("mb-0.5 flex h-7 w-7 items-center justify-center rounded-lg", pathname === "/settings" && "bg-[#E0F2F1]")}><Settings className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold leading-none">Settings</span>
            </Link>
            <button type="button" aria-expanded={isMoreOpen} aria-controls="more-navigation" onClick={() => setIsMoreOpen((open) => !open)} className={cn("flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-1.5 transition-colors", isMoreOpen ? "font-bold text-[#0F766E]" : "text-[#475569] hover:text-[#0F172A]")}>
              <span className={cn("mb-0.5 flex h-7 w-7 items-center justify-center rounded-lg", isMoreOpen && "bg-[#E0F2F1]")}><MoreHorizontal className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold leading-none">More</span>
            </button>
          </nav>
        </>
      )}
    </>
  );
}
