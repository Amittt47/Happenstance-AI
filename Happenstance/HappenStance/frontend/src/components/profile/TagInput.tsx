"use client";

import React, { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";

interface TagInputProps {
  label: string;
  helperText?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  maxItemLength?: number;
  variant?: "primary" | "secondary";
  suggestions?: string[];
}

export function TagInput({
  label,
  helperText,
  items,
  onChange,
  placeholder = "Add an item and press Enter",
  maxItems = 30,
  maxItemLength = 60,
  variant = "primary",
  suggestions = [],
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isAtLimit = items.length >= maxItems;

  const handleAdd = (valueToAdd?: string) => {
    const raw = valueToAdd !== undefined ? valueToAdd : inputValue;
    const trimmed = raw.trim();

    if (!trimmed) return;

    if (items.length >= maxItems) {
      setError(`Maximum limit of ${maxItems} items reached.`);
      return;
    }

    if (trimmed.length > maxItemLength) {
      setError(`Item cannot exceed ${maxItemLength} characters (currently ${trimmed.length}).`);
      return;
    }

    // Check case-insensitive duplicate
    const exists = items.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setError(`"${trimmed}" is already added.`);
      setInputValue("");
      return;
    }

    setError(null);
    onChange([...items, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Backspace" && !inputValue && items.length > 0) {
      // Remove the last item on backspace if input is empty
      onChange(items.slice(0, -1));
    }
  };

  const handleRemove = (indexToRemove: number) => {
    setError(null);
    onChange(items.filter((_, idx) => idx !== indexToRemove));
  };

  // Filter suggestions to only those not already in items
  const availableSuggestions = suggestions.filter(
    (sug) => !items.some((i) => i.toLowerCase() === sug.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Label and Count */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <label className="font-bold text-[#334155] uppercase tracking-wider">
            {label}
          </label>
          {helperText && (
            <span className="text-[#64748B] ml-2 font-normal">
              {helperText}
            </span>
          )}
        </div>
        <span
          className={`font-semibold ${
            isAtLimit ? "text-[#DC2626]" : "text-[#64748B]"
          }`}
        >
          {items.length} / {maxItems}
        </span>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            disabled={isAtLimit}
            maxLength={maxItemLength}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isAtLimit ? `Maximum ${maxItems} items reached` : placeholder}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A66C2] ${
              error
                ? "border-[#DC2626] focus:ring-[#DC2626]"
                : "border-[#CBD5E1] focus:border-[#0A66C2]"
            } ${isAtLimit ? "bg-[#F1F5F9] cursor-not-allowed opacity-75" : ""}`}
          />
          {inputValue.length > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] font-mono pointer-events-none">
              {inputValue.length}/{maxItemLength}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={isAtLimit || !inputValue.trim()}
          onClick={() => handleAdd()}
          className="px-4"
        >
          Add
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-[#DC2626] flex items-center gap-1 font-medium">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Tags Container */}
      <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <Badge
              key={`${item}-${idx}`}
              variant={variant}
              size="md"
              onRemove={() => handleRemove(idx)}
              className="text-xs py-1 px-2.5 shadow-2xs animate-fadeIn"
            >
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-[#94A3B8] self-center italic px-1">
            No items added yet. Type above and press Enter or select from recommendations below.
          </span>
        )}
      </div>

      {/* Quick Suggestions Chips */}
      {availableSuggestions.length > 0 && !isAtLimit && (
        <div className="pt-1">
          <p className="text-[11px] font-semibold text-[#64748B] mb-1.5 flex items-center gap-1">
            <span className="text-[#0A66C2]">✦</span> Suggested additions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.slice(0, 8).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleAdd(sug)}
                className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#E8F3FC] hover:border-[#0A66C2] hover:text-[#0A66C2] transition-colors focus:outline-none flex items-center gap-1 shadow-2xs"
              >
                <span>+</span> {sug}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TagInput;
