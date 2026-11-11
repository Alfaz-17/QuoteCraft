"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ShieldCheck
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
    href: "/",
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
          {isOwner && (
            <div className="pt-3 mt-2 border-t border-[#0D3845]/70">
              <Link
                href="/admin"
                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-[#F59E0B] border border-amber-500/30 transition-all min-h-[42px]"
              >
                <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="flex-1 truncate">Admin Command Center</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 font-black">
                  Owner
                </span>
              </Link>
            </div>
          )}
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

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Strictly 4 Items, z-30, safe-area aware) ── */}
      {/* Hidden when user is on the quotation builder ("/") so it does not block in-flow action buttons like "Download PDF" & "WhatsApp" */}
      {pathname !== "/" && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around"
        >
          {menuItems
            .filter((item) => ["/dashboard", "/", "/quotations", "/settings"].includes(item.href))
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-all duration-150 min-w-[60px] min-h-[48px]",
                    isActive
                      ? "text-[#0F766E] font-bold"
                      : "text-[#475569] hover:text-[#0F172A]"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-colors mb-0.5",
                      isActive ? "bg-[#E0F2F1] text-[#0F766E]" : ""
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[12px] font-semibold leading-none">{item.mobileLabel}</span>
                </Link>
              );
            })}
          {isOwner && (
            <Link
              href="/admin"
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-all duration-150 min-w-[60px] min-h-[48px]",
                pathname.startsWith("/admin")
                  ? "text-[#F59E0B] font-bold"
                  : "text-amber-600 hover:text-amber-700"
              )}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors mb-0.5 bg-amber-500/15 text-[#F59E0B]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[12px] font-semibold leading-none">Admin</span>
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
