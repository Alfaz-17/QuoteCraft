import type { Metadata } from "next";
import "./globals.css";

const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "QuoteCraft | Professional Marine Quotation Generator",
  description: "Create branded, professional PDF quotations for marine spare parts and ship supplies in minutes. Built for marine exporters and trading companies.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased text-slate-800"
      >
        <Providers>
          <div className="flex min-h-screen bg-slate-50/30">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

