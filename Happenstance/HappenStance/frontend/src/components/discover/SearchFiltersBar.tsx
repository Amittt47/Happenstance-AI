"use client";

import React from "react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";

interface SearchFiltersBarProps {
  keyword: string;
  skill: string;
  industry: string;
  location: string;
  onKeywordChange: (val: string) => void;
  onSkillChange: (val: string) => void;
  onIndustryChange: (val: string) => void;
  onLocationChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onClearAll: () => void;
  loading: boolean;
  totalResults?: number;
}

const POPULAR_SKILL_CHIPS = [
  "Distributed Systems",
  "Python",
  "React",
  "TypeScript",
  "Machine Learning",
  "Graph Theory",
  "Spring Boot",
  "Kubernetes",
];

export function SearchFiltersBar({
  keyword,
  skill,
  industry,
  location,
  onKeywordChange,
  onSkillChange,
  onIndustryChange,
  onLocationChange,
  onSubmit,
  onClearAll,
  loading,
  totalResults,
}: SearchFiltersBarProps) {
  const hasActiveFilters = Boolean(
    keyword.trim() || skill.trim() || industry.trim() || location.trim()
  );

  return (
    <Card className="space-y-4 p-5 shadow-xs">
      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Main Search Input */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="search"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="Search people by name, headline, bio, or skills..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-[#0A66C2] transition-colors shadow-2xs"
            />
            <svg
              className="absolute left-3.5 top-3 w-4 h-4 text-[#64748B] pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="px-6 font-semibold flex-1 sm:flex-initial shadow-xs"
            >
              Search
            </Button>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="quiet"
                size="md"
                onClick={onClearAll}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Granular Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Skill Filter */}
          <div className="relative">
            <input
              type="text"
              value={skill}
              onChange={(e) => onSkillChange(e.target.value)}
              placeholder="Filter by skill (e.g. Python)"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:bg-white transition-colors"
            />
            {skill && (
              <button
                type="button"
                onClick={() => onSkillChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#0F172A]"
                aria-label="Clear skill filter"
              >
                ×
              </button>
            )}
          </div>

          {/* Location Filter */}
          <div className="relative">
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Filter by location (e.g. San Francisco)"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:bg-white transition-colors"
            />
            {location && (
              <button
                type="button"
                onClick={() => onLocationChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#0F172A]"
                aria-label="Clear location filter"
              >
                ×
              </button>
            )}
          </div>

          {/* Industry Filter */}
          <div className="relative">
            <input
              type="text"
              value={industry}
              onChange={(e) => onIndustryChange(e.target.value)}
              placeholder="Filter by industry (e.g. AI, Cloud)"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:bg-white transition-colors"
            />
            {industry && (
              <button
                type="button"
                onClick={() => onIndustryChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#0F172A]"
                aria-label="Clear industry filter"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Quick Skill Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-[#64748B] mr-1 flex items-center gap-1">
            <span className="text-[#0A66C2]">✦</span> Quick Filters:
          </span>
          {POPULAR_SKILL_CHIPS.map((chip) => {
            const isActive = skill.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  onSkillChange(isActive ? "" : chip);
                }}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                  isActive
                    ? "bg-[#0A66C2] text-white border-[#0A66C2] font-semibold"
                    : "bg-white border-[#CBD5E1] text-[#475569] hover:bg-[#E8F3FC] hover:border-[#0A66C2] hover:text-[#0A66C2]"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </form>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#64748B] font-medium text-[11px]">Active filters:</span>
            {keyword.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F3FC] text-[#0A66C2] font-semibold text-[11px]">
                Keyword: &quot;{keyword}&quot;
                <button
                  type="button"
                  onClick={() => onKeywordChange("")}
                  className="hover:text-red-600 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {skill.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F3FC] text-[#0A66C2] font-semibold text-[11px]">
                Skill: {skill}
                <button
                  type="button"
                  onClick={() => onSkillChange("")}
                  className="hover:text-red-600 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {location.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F3FC] text-[#0A66C2] font-semibold text-[11px]">
                Location: {location}
                <button
                  type="button"
                  onClick={() => onLocationChange("")}
                  className="hover:text-red-600 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {industry.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F3FC] text-[#0A66C2] font-semibold text-[11px]">
                Industry: {industry}
                <button
                  type="button"
                  onClick={() => onIndustryChange("")}
                  className="hover:text-red-600 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-[#DC2626] hover:underline font-semibold"
          >
            Clear all filters
          </button>
        </div>
      )}
    </Card>
  );
}

export default SearchFiltersBar;
