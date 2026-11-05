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
  Globe
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
    mobileLabel: "My Quotes",
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
  if (!isLoaded || !isSignedIn) return null;

  const displayName = user?.fullName || user?.firstName || user?.username || "Marine Supplier";
  const userInitial = displayName.charAt(0).toUpperCase() || "M";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userRole = "Marine Supplier";

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
              onClick={() => signOut({ redirectUrl: "/login" })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 shadow-lg flex items-center justify-around safe-bottom">
        {menuItems.filter(item => !item.isExternal && item.name !== "New Quotation").map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 min-w-[56px]",
                isActive
                  ? "text-[#0F766E] font-bold"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center transition-colors mb-0.5",
                isActive ? "bg-[#E0F2F1] text-[#0F766E]" : ""
              )}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
