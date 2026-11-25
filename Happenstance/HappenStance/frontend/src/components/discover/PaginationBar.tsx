"use client";

import React from "react";
import { Button } from "@/components/common/Button";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export function PaginationBar({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  disabled = false,
}: PaginationBarProps) {
  if (totalPages <= 1 && totalElements <= pageSize) {
    return null;
  }

  const startIdx = page * pageSize + 1;
  const endIdx = Math.min((page + 1) * pageSize, totalElements);

  // Generate page numbers to show (max 5 around current)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
      <div>
        Showing <span className="font-bold text-[#0F172A]">{startIdx}</span> to{" "}
        <span className="font-bold text-[#0F172A]">{endIdx}</span> of{" "}
        <span className="font-bold text-[#0F172A]">{totalElements}</span> members
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="text-xs px-3 py-1.5"
        >
          ← Previous
        </Button>

        {pageNumbers.map((p) => {
          const isCurrent = p === page;
          return (
            <button
              key={p}
              type="button"
              disabled={disabled || isCurrent}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                isCurrent
                  ? "bg-[#0A66C2] text-white shadow-xs cursor-default"
                  : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {p + 1}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="text-xs px-3 py-1.5"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

export default PaginationBar;
