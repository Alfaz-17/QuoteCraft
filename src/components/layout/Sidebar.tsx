"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  Settings, 
  Ship, 
  ChevronRight, 
  LogOut, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & quick actions",
    mobileLabel: "Dashboard",
  },
  {
    name: "RFQ Builder",
    href: "/",
    icon: FileText,
    description: "Create quotations",
    mobileLabel: "Builder",
  },
  {
    name: "Quotations",
    href: "/quotations",
    icon: History,
    description: "History & records",
    mobileLabel: "Quotes",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Branding & profile",
    mobileLabel: "Settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Don't render sidebar at all if not authenticated
  if (status !== "authenticated") return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white h-screen sticky top-0 shrink-0 z-30">
        <div className="p-5 border-b flex items-center gap-3 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md rotate-3 overflow-hidden">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">QuoteCraft</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mt-1">Marine & Industrial</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 min-h-[44px]",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]" 
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-primary transition-colors")} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs leading-none">{item.name}</p>
                  <p className={cn("text-[10px] mt-1 truncate", isActive ? "text-white/80" : "text-slate-400")}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight className={cn("w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all shrink-0", isActive && "opacity-100 translate-x-0")} />
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t mt-auto space-y-2 bg-slate-50/50">
          {session?.user && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200/70">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{session.user.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold min-h-[40px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all relative min-h-[48px]",
                  isActive
                    ? "text-primary font-bold"
                    : "text-slate-500 hover:text-slate-900 active:scale-95"
                )}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-in fade-in zoom-in-50 duration-200" />
                )}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl transition-all",
                  isActive
                    ? "bg-primary/10 text-primary scale-105"
                    : "text-slate-500"
                )}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] tracking-tight leading-none">
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
