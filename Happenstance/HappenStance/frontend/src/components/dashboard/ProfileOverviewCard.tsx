"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import type { AuthUser, Profile } from "@/lib/api";

interface ProfileOverviewCardProps {
  user: AuthUser | null;
  profile: Profile | null;
  connectionsCount: number;
}

export function ProfileOverviewCard({
  user,
  profile,
  connectionsCount,
}: ProfileOverviewCardProps) {
  // Calculate profile completeness score (0-100%)
  const fields = [
    Boolean(user?.displayName),
    Boolean(profile?.headline),
    Boolean(profile?.bio),
    Boolean(profile?.location),
    Boolean(profile?.industry),
    Boolean(profile?.skills && profile.skills.length > 0),
    Boolean(profile?.interests && profile.interests.length > 0),
  ];
  const completedFields = fields.filter(Boolean).length;
  const completenessPercent = Math.round((completedFields / fields.length) * 100);

  return (
    <Card padded={false} className="overflow-hidden text-center sticky top-20 shadow-sm border border-[#E2E8F0]">
      {/* Decorative Header Banner */}
      <div className="h-24 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A66C2] relative">
        <div className="absolute top-2.5 right-2.5">
          <Badge
            variant={profile?.visibility === "PUBLIC" ? "primary" : "secondary"}
            size="sm"
            className="text-[10px] bg-white/95 backdrop-blur-xs font-bold shadow-2xs"
          >
            {profile?.visibility || "PUBLIC"}
          </Badge>
        </div>
      </div>

      {/* Avatar & User Details */}
      <div className="px-5 pb-5 pt-0 relative bg-white">
        <div className="-mt-12 mb-3 inline-block relative z-10">
          <div className="w-20 h-20 rounded-full bg-white p-1.5 shadow-md mx-auto">
            <div className="w-full h-full rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-2xl shadow-inner">
              {(profile?.displayName || user?.displayName || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>

        <Link href="/profile" className="group focus:outline-none block">
          <h2 className="text-base font-bold text-[#0F172A] group-hover:text-[#0A66C2] transition-colors truncate px-1">
            {profile?.displayName || user?.displayName || "HappenStance Member"}
          </h2>
        </Link>

        <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
          {profile?.headline || "Add your professional headline"}
        </p>

        <p className="text-[11px] text-[#94A3B8] mt-1.5 truncate">
          {[profile?.location, profile?.industry].filter(Boolean).join(" · ") || user?.email}
        </p>

        {/* Profile Completeness Bar */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-left">
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="font-semibold text-[#64748B]">Profile Strength</span>
            <span className="font-bold text-[#0A66C2]">{completenessPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A66C2] rounded-full transition-all duration-500"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          {completenessPercent < 100 && (
            <Link
              href="/profile"
              className="block text-[11px] text-[#0A66C2] font-semibold hover:underline mt-1.5"
            >
              Complete your profile for better matches ↗
            </Link>
          )}
        </div>

        {/* Quick Metrics */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-left space-y-2.5">
          <Link
            href="/network"
            className="flex justify-between items-center text-xs font-medium text-[#475569] hover:text-[#0A66C2] group"
          >
            <span>Connections</span>
            <span className="font-bold text-[#0A66C2] group-hover:underline">
              {connectionsCount}
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex justify-between items-center text-xs font-medium text-[#475569] hover:text-[#0A66C2] group"
          >
            <span>Edit Profile</span>
            <span className="text-[#64748B] group-hover:text-[#0A66C2]">✎</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default ProfileOverviewCard;
