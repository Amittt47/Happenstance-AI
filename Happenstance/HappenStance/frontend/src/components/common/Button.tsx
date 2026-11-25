"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "quiet" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const base =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    // Size styles
    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-2.5 text-base gap-2.5",
    };

    // Variant styles matching LinkedIn premium professional aesthetic
    const variants = {
      primary:
        "bg-[#0A66C2] text-white hover:bg-[#004182] active:bg-[#00305F] shadow-sm focus-visible:ring-[#0A66C2]",
      secondary:
        "bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] border border-[#CBD5E1] focus-visible:ring-[#64748B]",
      outline:
        "bg-transparent text-[#0A66C2] border border-[#0A66C2] hover:bg-[#E8F3FC] hover:border-[#004182] active:bg-[#CFE5F8] focus-visible:ring-[#0A66C2]",
      quiet:
        "bg-transparent text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] active:bg-[#E2E8F0] focus-visible:ring-[#94A3B8]",
      danger:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-sm focus-visible:ring-[#DC2626]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
