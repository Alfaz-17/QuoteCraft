"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const success = useCallback((message: string, duration?: number) => toast(message, "success", duration), [toast]);
  const error = useCallback((message: string, duration?: number) => toast(message, "error", duration), [toast]);
  const info = useCallback((message: string, duration?: number) => toast(message, "info", duration), [toast]);
  const warning = useCallback((message: string, duration?: number) => toast(message, "warning", duration), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, dismiss, toasts }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100vw-40px)] pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { message, type, duration = 4000 } = toast;
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300); // start exit slide before auto-dismiss

    const autoDismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    const step = 100 / (duration / 30);
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) return 0;
        return prev - step;
      });
    }, 30);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoDismissTimer);
      clearInterval(progressTimer);
    };
  }, [duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-600 shrink-0" />,
  };

  const borderColors = {
    success: "border-emerald-100 bg-white/95 text-emerald-900 shadow-emerald-100/50",
    error: "border-rose-100 bg-white/95 text-rose-900 shadow-rose-100/50",
    warning: "border-amber-100 bg-white/95 text-amber-900 shadow-amber-100/50",
    info: "border-sky-100 bg-white/95 text-sky-900 shadow-sky-100/50",
  };

  const progressColors = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-sky-500",
  };

  return (
    <div
      className={`pointer-events-auto relative flex flex-col overflow-hidden rounded-xl border p-3.5 shadow-xl transition-all duration-300 ${
        borderColors[type]
      } ${
        isExiting ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">{icons[type]}</div>
        <div className="flex-1 pr-4">
          <p className="text-[11px] font-bold tracking-tight text-slate-800 leading-normal">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onDismiss, 200);
          }}
          className="absolute top-2 right-2 rounded-full p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-100/40">
        <div
          className={`h-full transition-all duration-75 ease-linear ${progressColors[type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
