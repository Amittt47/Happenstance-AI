"use client";

import React from "react";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import type { AuthUser, Profile } from "@/lib/api";

interface ProfileHeaderCardProps {
  user: AuthUser | null;
  profile: Profile | null;
  completenessPercent: number;
  nextSuggestion?: string;
  hasUnsavedChanges?: boolean;
}

export function ProfileHeaderCard({
  user,
  profile,
  completenessPercent,
  nextSuggestion,
  hasUnsavedChanges = false,
}: ProfileHeaderCardProps) {
  const getVisibilityBadge = () => {
    switch (profile?.visibility) {
      case "PUBLIC":
        return { variant: "primary" as const, label: "Public Profile", dot: "bg-emerald-500" };
      case "CONNECTIONS":
        return { variant: "secondary" as const, label: "Connections Only", dot: "bg-sky-500" };
      case "PRIVATE":
        return { variant: "secondary" as const, label: "Private Profile", dot: "bg-amber-500" };
      default:
        return { variant: "primary" as const, label: "Public Profile", dot: "bg-emerald-500" };
    }
  };

  const badgeInfo = getVisibilityBadge();

  return (
    <Card className="p-0 overflow-hidden shadow-sm">
      {/* Decorative Cover Banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A66C2] relative overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Top Right Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Unsaved Edits
            </span>
          )}
          <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <span className={`w-2 h-2 rounded-full ${badgeInfo.dot}`} />
            <span className="text-[11px] font-bold text-[#0F172A]">
              {badgeInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Details Container */}
      <div className="px-5 sm:px-8 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Avatar and Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="-mt-16 sm:-mt-20 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1.5 shadow-lg flex-shrink-0 relative z-10">
              <div className="w-full h-full rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-4xl shadow-inner">
                {(user?.displayName || "U").slice(0, 1).toUpperCase()}
              </div>
            </div>

            <div className="pt-2 sm:pt-3 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight truncate">
                {user?.displayName || "HappenStance Member"}
              </h1>

              <p className="text-sm sm:text-base text-[#475569] mt-0.5 leading-relaxed font-medium">
                {profile?.headline || (
                  <span className="text-[#94A3B8] italic">
                    Add a professional headline to describe what you do
                  </span>
                )}
              </p>

              {/* Location & Industry Metadata */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-[#64748B] mt-2">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#0A66C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </span>
                )}

                {profile?.industry && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#0A66C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.industry}
                  </span>
                )}

                <span className="flex items-center gap-1 text-[#94A3B8]">
                  <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Last Updated */}
          <div className="flex flex-col items-center sm:items-end gap-1.5 self-center sm:self-start sm:pt-3 text-xs text-[#64748B]">
            {profile?.updatedAt && (
              <span className="text-[11px] text-[#94A3B8]">
                Last saved {new Date(profile.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Profile Strength Progress Bar */}
        <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">
                Profile Strength
              </span>
              <span className="text-xs font-bold text-[#0A66C2]">
                {completenessPercent}%
              </span>
              <span className="text-[11px] text-[#64748B]">
                {completenessPercent === 100
                  ? "— All-Star Profile"
                  : completenessPercent >= 75
                  ? "— Strong Profile"
                  : "— In Progress"}
              </span>
            </div>

            {nextSuggestion && completenessPercent < 100 && (
              <span className="text-xs text-[#0A66C2] font-semibold">
                ✦ Tip: {nextSuggestion}
              </span>
            )}
          </div>

          <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                completenessPercent === 100
                  ? "bg-emerald-500"
                  : completenessPercent >= 75
                  ? "bg-[#0A66C2]"
                  : "bg-amber-500"
              }`}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ProfileHeaderCard;
