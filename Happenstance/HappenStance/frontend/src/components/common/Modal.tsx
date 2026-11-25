"use client";

import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  kicker?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  kicker,
  children,
  maxWidth = "lg",
  className = "",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${maxWidths[maxWidth]} bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors text-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
            aria-label="Close dialog"
          >
            ×
          </button>

          {kicker && (
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#0A66C2] mb-1">
              {kicker}
            </div>
          )}

          {title && (
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight pr-8">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="text-sm text-[#64748B] mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Scrollable body */}
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto text-[#0F172A]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
