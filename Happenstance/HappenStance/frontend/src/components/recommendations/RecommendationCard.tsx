"use client";

import React from "react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import type { Recommendation } from "@/lib/api";

interface RecommendationCardProps {
  recommendation: Recommendation;
  isConnecting?: boolean;
  isRequested?: boolean;
  onConnect: (userId: string, name?: string) => void;
  onViewProfile: (userId: string) => void;
  onViewBreakdown: (rec: Recommendation) => void;
}

export function RecommendationCard({
  recommendation,
  isConnecting = false,
  isRequested = false,
  onConnect,
  onViewProfile,
  onViewBreakdown,
}: RecommendationCardProps) {
  const name = recommendation.displayName || "HappenStance Member";
  const initial = name.slice(0, 1).toUpperCase();
  const score = recommendation.score;

  const metaString = [recommendation.location, recommendation.industry]
    .filter(Boolean)
    .join(" · ");

  // Color-coded match badge based on real backend score
  const getScoreBadgeClass = () => {
    if (score >= 70) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (score >= 40) {
      return "bg-blue-50 text-[#0A66C2] border-blue-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <Card className="p-4 sm:p-5 hover:border-[#CBD5E1] transition-all shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Profile Details & Match Reasons */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onViewProfile(recommendation.userId)}
            className="w-13 h-13 rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs hover:ring-2 hover:ring-[#0A66C2]/20 transition-all focus:outline-none"
            aria-label={`View ${name}'s profile`}
          >
            {initial}
          </button>

          <div className="flex-1 min-w-0">
            {/* Name & Match Score Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onViewProfile(recommendation.userId)}
                className="font-bold text-sm sm:text-base text-[#0F172A] hover:text-[#0A66C2] transition-colors truncate block text-left focus:outline-none"
              >
                {name}
              </button>

              {typeof score === "number" && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBadgeClass()}`}
                >
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{score}% Match</span>
                </span>
              )}
            </div>

            {/* Headline */}
            <p className="text-xs sm:text-sm text-[#475569] mt-0.5 line-clamp-2">
              {recommendation.headline || recommendation.industry || "Professional on HappenStance"}
            </p>

            {/* Location & Industry */}
            {metaString && (
              <p className="text-[11px] text-[#64748B] truncate mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3 text-[#94A3B8] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{metaString}</span>
              </p>
            )}

            {/* Verified Matching Factors from Backend */}
            {recommendation.reasons && recommendation.reasons.length > 0 && (
              <div className="mt-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Why you match
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recommendation.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0A66C2] bg-[#E8F3FC] px-2.5 py-0.5 rounded-md border border-[#BAE0FD]/70"
                    >
                      <svg
                        className="w-3 h-3 text-[#0A66C2]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{reason}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills & Interests Tags */}
            {recommendation.skills && recommendation.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-3">
                {recommendation.skills.slice(0, 4).map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    size="sm"
                    className="text-[10px] py-0.5 px-2 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]"
                  >
                    {skill}
                  </Badge>
                ))}
                {recommendation.skills.length > 4 && (
                  <span className="text-[10px] text-[#94A3B8]">
                    +{recommendation.skills.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9] justify-end flex-shrink-0">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isConnecting || isRequested}
            isLoading={isConnecting}
            onClick={() => onConnect(recommendation.userId, name)}
            className="text-xs min-w-[96px] shadow-xs"
          >
            {isRequested ? "✓ Requested" : "Connect"}
          </Button>

          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => onViewProfile(recommendation.userId)}
            className="text-xs text-[#475569] hover:text-[#0A66C2]"
          >
            View Profile
          </Button>

          {recommendation.reasons && recommendation.reasons.length > 0 && (
            <button
              type="button"
              onClick={() => onViewBreakdown(recommendation)}
              className="text-[11px] font-semibold text-[#0A66C2] hover:underline focus:outline-none hidden sm:block"
            >
              Match Analysis ℹ
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default RecommendationCard;
