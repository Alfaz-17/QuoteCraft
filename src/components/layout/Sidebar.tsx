"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Settings, Ship, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    name: "RFQ Builder",
    href: "/",
    icon: FileText,
    description: "Create marine documents",
    mobileLabel: "Builder",
  },
  {
    name: "Company Settings",
    href: "/settings",
    icon: Settings,
    description: "Branding & profile",
    mobileLabel: "Settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white h-screen sticky top-0">
        <div className="p-6 border-b flex items-center gap-3 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg rotate-3 overflow-hidden">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">MarineQuote</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">Premium RFQs</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                    : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                <div className="flex-1">
                  <p className="font-semibold text-sm leading-none">{item.name}</p>
                  <p className={cn("text-[10px] mt-1 opacity-70", isActive ? "text-white" : "text-muted-foreground")}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight className={cn("w-4 h-4 opacity-0 -translate-x-2 transition-all", isActive && "opacity-100 translate-x-0")} />
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t mt-auto">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 italic text-[10px] text-muted-foreground">
            &quot;Precision in every quotation, standard in every RFQ.&quot;
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16 px-4 max-w-lg mx-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-300 relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:scale-95"
                )}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-in fade-in zoom-in-50 duration-300" />
                )}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-primary/10 scale-110"
                    : "hover:bg-slate-50"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area spacer for devices with home indicators */}
        <div className="h-safe-area-bottom" />
      </nav>
    </>
  );
}
