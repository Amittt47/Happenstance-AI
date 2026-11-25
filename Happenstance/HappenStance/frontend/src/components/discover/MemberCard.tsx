"use client";

import React from "react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import type { Profile } from "@/lib/api";

export type MemberConnectionStatus = "NONE" | "PENDING" | "CONNECTED" | "INCOMING";

interface MemberCardProps {
  person: Profile;
  connectionStatus: MemberConnectionStatus;
  isConnecting: boolean;
  mutualCount?: number;
  onConnect: (userId: string, name?: string) => void;
  onViewProfile: (userId: string) => void;
}

export function MemberCard({
  person,
  connectionStatus,
  isConnecting,
  mutualCount,
  onConnect,
  onViewProfile,
}: MemberCardProps) {
  const initial = (person.displayName || person.headline || "M")
    .slice(0, 1)
    .toUpperCase();

  const metaString = [person.location, person.industry]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="flex flex-col justify-between p-5 hover:border-[#CBD5E1] hover:shadow-md transition-all group duration-200">
      <div>
        {/* Top Header: Avatar & Member Info */}
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={() => onViewProfile(person.userId)}
            className="w-13 h-13 rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs ring-2 ring-transparent group-hover:ring-[#0A66C2]/20 transition-all focus:outline-none"
            aria-label={`View ${person.displayName || "member"}'s profile`}
          >
            {initial}
          </button>

          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onViewProfile(person.userId)}
              className="font-bold text-sm text-[#0F172A] group-hover:text-[#0A66C2] transition-colors truncate block text-left w-full focus:outline-none"
            >
              {person.displayName || "HappenStance Member"}
            </button>

            <p className="text-xs text-[#64748B] line-clamp-2 mt-0.5 leading-relaxed">
              {person.headline || (
                <span className="italic text-[#94A3B8]">
                  {person.industry || "Professional Member"}
                </span>
              )}
            </p>

            {metaString && (
              <p className="text-[11px] text-[#94A3B8] truncate mt-1 flex items-center gap-1">
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
                <span className="truncate">{metaString}</span>
              </p>
            )}

            {mutualCount !== undefined && mutualCount > 0 && (
              <p className="text-[11px] text-[#0A66C2] font-semibold truncate mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3 text-[#0A66C2] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>{mutualCount} mutual connection{mutualCount === 1 ? "" : "s"}</span>
              </p>
            )}
          </div>
        </div>

        {/* Skills Tag Cloud */}
        {person.skills && person.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3.5 pt-1">
            {person.skills.slice(0, 3).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                size="sm"
                className="text-[11px] py-0.5 px-2 bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
              >
                {skill}
              </Badge>
            ))}
            {person.skills.length > 3 && (
              <span className="text-[10px] font-semibold text-[#64748B] self-center px-1.5 py-0.5 rounded-full bg-[#F8FAFC]">
                +{person.skills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 mt-5 pt-3.5 border-t border-[#F1F5F9]">
        <Button
          variant="quiet"
          size="sm"
          onClick={() => onViewProfile(person.userId)}
          className="flex-1 text-xs text-[#475569] hover:text-[#0A66C2] py-1.5"
        >
          View Profile
        </Button>

        {connectionStatus === "CONNECTED" ? (
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="flex-1 text-xs py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default font-medium"
          >
            <span className="mr-1">✓</span> Connected
          </Button>
        ) : connectionStatus === "PENDING" ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="flex-1 text-xs py-1.5 bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] cursor-default font-medium"
          >
            <span className="mr-1 text-[11px]">⏳</span> Requested
          </Button>
        ) : connectionStatus === "INCOMING" ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewProfile(person.userId)}
            className="flex-1 text-xs py-1.5 font-medium"
          >
            Review Request
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isConnecting}
            isLoading={isConnecting}
            onClick={() => onConnect(person.userId, person.displayName)}
            className="flex-1 text-xs py-1.5 border-[#0A66C2] text-[#0A66C2] hover:bg-[#E8F3FC] font-semibold flex items-center justify-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}

export default MemberCard;
