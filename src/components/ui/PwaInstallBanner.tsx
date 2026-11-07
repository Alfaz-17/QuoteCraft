"use client";

import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // 1. Check if already running in standalone/PWA mode (home screen app)
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return; // Already installed and running like native app
    }

    // 2. Check if user dismissed previously in this session/device
    const dismissed = localStorage.getItem("pwa_install_dismissed");
    if (dismissed === "true") {
      return;
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);

    if (isIosDevice) {
      // Delay so user isn't immediately bombarded upon landing
      const timer = setTimeout(() => {
        setIsIos(true);
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Android/Chromium: listen to beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 3s delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem("pwa_install_dismissed", "true");
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Add to Home Screen"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] leading-tight">
              Use as Native App
            </h3>
            <p className="text-xs text-[#475569] leading-snug mt-0.5">
              Add to Home Screen for fast 1-tap access &amp; full-screen view
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors -mr-1 -mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIos ? (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#0F172A]">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 font-bold text-[11px] text-[#0F766E] shrink-0">
              1
            </span>
            <span>
              Tap the <Share className="w-3.5 h-3.5 inline text-[#0F766E] mx-1" />{" "}
              <strong>Share</strong> icon in Safari bar
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#0F172A]">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 font-bold text-[11px] text-[#0F766E] shrink-0">
              2
            </span>
            <span>
              Scroll down &amp; tap{" "}
              <PlusSquare className="w-3.5 h-3.5 inline text-[#0F766E] mx-1" />{" "}
              <strong>Add to Home Screen</strong>
            </span>
          </div>

          <div className="pt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0F766E] hover:bg-teal-50 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:bg-slate-100 transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6B63] shadow-sm shadow-[#0F766E]/20 active:scale-95 transition-all"
          >
            Add to Phone
          </button>
        </div>
      )}
    </div>
  );
}
