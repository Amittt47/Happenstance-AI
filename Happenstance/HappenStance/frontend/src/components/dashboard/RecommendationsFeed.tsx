"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import type { Recommendation, Profile } from "@/lib/api";

interface RecommendationsFeedProps {
  recommendations: Recommendation[];
  loading: boolean;
  onRefresh: () => void;
  onConnect: (userId: string, name?: string) => Promise<void>;
  onViewProfile: (userId: string) => void;
  connectingIds: Set<string>;
  connectedIds: Set<string>;
}

export function RecommendationsFeed({
  recommendations,
  loading,
  onRefresh,
  onConnect,
  onViewProfile,
  connectingIds,
  connectedIds,
}: RecommendationsFeedProps) {
  return (
    <div className="space-y-4">
      {/* Search Prompt Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center font-bold text-sm flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Link
            href="/discover"
            className="flex-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#64748B] text-left transition-colors flex items-center justify-between"
          >
            <span>Search people by skills, industry, or location...</span>
            <span className="text-[#0A66C2] font-semibold text-xs hidden sm:inline">Search ↗</span>
          </Link>
        </div>
      </Card>

      {/* Recommendations Feed Card */}
      <Card>
        <CardHeader
          title="Recommended For You"
          subtitle="Ranked connections scored using shared skills, industry, location, and mutual network"
          action={
            <div className="flex items-center gap-2">
              <Link
                href="/recommendations"
                className="text-xs font-semibold text-[#0A66C2] hover:underline hidden sm:inline-block"
              >
                View All ↗
              </Link>
              <Button
                variant="quiet"
                size="sm"
                onClick={onRefresh}
                isLoading={loading}
                className="text-xs"
              >
                Refresh ↻
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm text-[#64748B]">
              Analyzing network graph and calculating match scores...
            </p>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4 divide-y divide-[#F1F5F9]">
            {recommendations.map((person, idx) => {
              const isConnecting = connectingIds.has(person.userId);
              const isConnected = connectedIds.has(person.userId);

              return (
                <div
                  key={person.userId || idx}
                  className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-4 first:pt-0 ${
                    idx > 0 ? "pt-4" : ""
                  }`}
                >
                  {/* Member Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs">
                      {(person.displayName || person.headline || "P").slice(0, 1).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onViewProfile(person.userId)}
                          className="font-bold text-sm sm:text-base text-[#0F172A] hover:text-[#0A66C2] transition-colors text-left truncate focus:outline-none"
                        >
                          {person.displayName || "HappenStance member"}
                        </button>
                        <Badge variant="success" size="sm" className="font-bold">
                          {person.score}% match
                        </Badge>
                      </div>

                      <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                        {person.headline || person.industry || "Professional Profile"}
                      </p>

                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {[person.location, person.industry].filter(Boolean).join(" · ")}
                      </p>

                      {/* Explainability Reasons */}
                      {person.reasons && person.reasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {person.reasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center text-[10px] sm:text-[11px] font-medium text-[#0A66C2] bg-[#E8F3FC] px-2 py-0.5 rounded-md"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Skills Tags */}
                      {person.skills && person.skills.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {person.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="neutral" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {person.skills.length > 4 && (
                            <span className="text-[10px] text-[#94A3B8] self-center">
                              +{person.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 self-end sm:self-start">
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => onViewProfile(person.userId)}
                      className="text-xs"
                    >
                      View profile
                    </Button>

                    <Button
                      variant={isConnected ? "secondary" : "outline"}
                      size="sm"
                      disabled={isConnecting || isConnected}
                      isLoading={isConnecting}
                      onClick={() => onConnect(person.userId, person.displayName)}
                      className="text-xs min-w-[84px]"
                    >
                      {isConnected ? "Requested" : "Connect"}
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className="pt-3 text-center">
              <Link
                href="/recommendations"
                className="text-xs font-bold text-[#0A66C2] hover:underline inline-flex items-center gap-1"
              >
                <span>Explore all recommendations & matching breakdown</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-semibold text-[#0F172A]">
              No recommendations available right now.
            </p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Recommendations are generated using shared skills, interests, and mutual network paths. Update your profile or discover members to get started!
            </p>
            <div className="pt-3">
              <Link href="/profile">
                <Button variant="primary" size="sm">
                  Update Profile Skills
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default RecommendationsFeed;
