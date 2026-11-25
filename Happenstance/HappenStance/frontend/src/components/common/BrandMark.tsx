"use client";

import React from "react";

interface BrandMarkProps {
  size?: number;
  className?: string;
  variant?: "primary" | "light" | "navy";
}

export function BrandMark({ size = 34, className = "", variant = "primary" }: BrandMarkProps) {
  const strokeColor =
    variant === "light"
      ? "#FFFFFF"
      : variant === "navy"
      ? "#0F172A"
      : "#0A66C2";

  const nodeColor1 = variant === "light" ? "#E0F2FE" : "#0284C7";
  const nodeColor2 = variant === "light" ? "#FFFFFF" : "#0A66C2";
  const nodeCenter = variant === "light" ? "#38BDF8" : "#0F172A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Network connector lines */}
      <path
        d="M9 28 20 10l11 18M9 28h22M20 10v18"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Node circles */}
      <circle cx="9" cy="28" r="4.2" fill={nodeColor1} />
      <circle cx="20" cy="10" r="4.2" fill={nodeColor2} />
      <circle cx="31" cy="28" r="4.2" fill={nodeColor1} />
      <circle cx="20" cy="28" r="3.2" fill={nodeCenter} />
    </svg>
  );
}

export default BrandMark;
