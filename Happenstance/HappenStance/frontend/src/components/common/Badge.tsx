"use client";

import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "neutral" | "outline";
  size?: "sm" | "md";
  onRemove?: () => void;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  onRemove,
  className = "",
}: BadgeProps) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-medium",
  };

  const variants = {
    primary: "bg-[#E8F3FC] text-[#0A66C2] border border-[#BFDBFE]",
    secondary: "bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]",
    success: "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]",
    warning: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
    neutral: "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]",
    outline: "bg-transparent text-[#0A66C2] border border-[#0A66C2]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full transition-colors ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none"
          aria-label="Remove"
        >
          <span className="text-xs leading-none">×</span>
        </button>
      )}
    </span>
  );
}

export default Badge;
