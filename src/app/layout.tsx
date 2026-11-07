import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuoteCraft | Professional Marine Quotation Generator",
  description: "Create branded, professional PDF quotations for marine spare parts and ship supplies in minutes. Built for marine exporters and trading companies.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuoteCraft",
  },
  formatDetection: {
    telephone: false,
  },
};

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F766E",
};

import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "./providers";
import { PwaInstallBanner } from "@/components/ui/PwaInstallBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body
        className="font-sans antialiased text-[#0F172A] bg-[#FAF9F5]"
      >
        <Providers>
          <div className="flex min-h-screen bg-[#FAF9F5]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {children}
            </div>
          </div>
          <PwaInstallBanner />
        </Providers>
      </body>
    </html>
  );
}

