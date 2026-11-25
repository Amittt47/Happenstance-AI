"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "info" | "success" | "error" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4200);
    },
    [removeToast]
  );

  const toastContext: ToastContextType = {
    toast: addToast,
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    info: (msg: string) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toastContext}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const typeStyles = {
            success: "bg-white border-l-4 border-[#059669] text-[#0F172A] shadow-lg",
            error: "bg-white border-l-4 border-[#DC2626] text-[#0F172A] shadow-lg",
            warning: "bg-white border-l-4 border-[#D97706] text-[#0F172A] shadow-lg",
            info: "bg-white border-l-4 border-[#0A66C2] text-[#0F172A] shadow-lg",
          };

          const icon = {
            success: "✓",
            error: "✕",
            warning: "⚠",
            info: "ℹ",
          }[item.type];

          const iconColor = {
            success: "text-[#059669] bg-[#ECFDF5]",
            error: "text-[#DC2626] bg-[#FEF2F2]",
            warning: "text-[#D97706] bg-[#FFFBEB]",
            info: "text-[#0A66C2] bg-[#E8F3FC]",
          }[item.type];

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border border-[#E2E8F0] ${typeStyles[item.type]} transition-all duration-300 animate-in slide-in-from-top-2`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${iconColor}`}
              >
                {icon}
              </span>
              <p className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                {item.message}
              </p>
              <button
                onClick={() => removeToast(item.id)}
                className="text-[#94A3B8] hover:text-[#0F172A] text-sm leading-none p-1"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      toast: (msg: string) => console.log(msg),
      success: (msg: string) => console.log(msg),
      error: (msg: string) => console.error(msg),
      info: (msg: string) => console.log(msg),
    };
  }
  return context;
}
