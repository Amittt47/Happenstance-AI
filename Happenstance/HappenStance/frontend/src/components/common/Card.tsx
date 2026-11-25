"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  padded?: boolean;
  className?: string;
}

export function Card({
  children,
  interactive = false,
  padded = true,
  className = "",
  ...props
}: CardProps) {
  const base =
    "bg-white rounded-xl border border-[#E2E8F0] shadow-sm transition-all duration-200 overflow-hidden";
  const hoverStyle = interactive
    ? "hover:border-[#CBD5E1] hover:shadow-md cursor-pointer"
    : "";
  const hasPaddingOverride = className.includes("p-0") || className.includes("p-");
  const padding = padded && !hasPaddingOverride ? "p-5 sm:p-6" : "";

  return (
    <div className={`${base} ${hoverStyle} ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between pb-4 border-b border-[#F1F5F9] mb-4 ${className}`}>
      <div>
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}

export default Card;
