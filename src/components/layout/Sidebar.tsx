"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Settings, 
  Ship, 
  LogOut, 
  LifeBuoy,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    mobileLabel: "Dashboard",
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
      {/* Desktop Sidebar: Dark Navy Theme from Mockup */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0B1528] text-slate-200 h-screen sticky top-0 shrink-0 z-30 select-none border-r border-slate-800/80">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Ship className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-none">
              QuoteCraft
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
              Marine & Industrial
            </p>
          </div>
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
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200 shrink-0" />}
              </Component>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-800/80 mt-auto bg-[#070D1A]">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-blue-400/30 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5" title={userEmail}>
                  {userRole}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ redirectUrl: "/login" })}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Part of Mobile-First Architecture) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1528] border-t border-slate-800/80 z-50 px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-lg">
        {menuItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all min-h-[44px]",
                isActive 
                  ? "text-blue-400 font-bold bg-blue-500/10" 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <item.icon className={cn("w-4 h-4 mb-1", isActive && "text-blue-400")} />
              <span>{item.mobileLabel}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
