"use client";

import React from "react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import type { Profile, Relationship } from "@/lib/api";

interface InvitationCardProps {
  type: "incoming" | "outgoing";
  relationship: Relationship;
  person: Profile | null;
  onViewProfile: (userId: string) => void;
  onAccept?: (relationshipId: string) => void;
  onDecline?: (relationshipId: string) => void;
  onWithdraw?: (relationshipId: string, memberName: string) => void;
  isBusy?: boolean;
}

export function InvitationCard({
  type,
  relationship,
  person,
  onViewProfile,
  onAccept,
  onDecline,
  onWithdraw,
  isBusy = false,
}: InvitationCardProps) {
  const relId = relationship.id || relationship.relationshipId || "";
  const name = person?.displayName || "HappenStance Member";
  const initial = name.slice(0, 1).toUpperCase();

  const metaString = [person?.location, person?.industry]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="p-4 sm:p-5 hover:border-[#CBD5E1] transition-all shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Profile Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => person?.userId && onViewProfile(person.userId)}
            className="w-13 h-13 rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs hover:ring-2 hover:ring-[#0A66C2]/20 transition-all focus:outline-none"
            aria-label={`View ${name}'s profile`}
          >
            {initial}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => person?.userId && onViewProfile(person.userId)}
                className="font-bold text-sm text-[#0F172A] hover:text-[#0A66C2] transition-colors truncate block text-left focus:outline-none"
              >
                {name}
              </button>

              {type === "outgoing" && (
                <Badge variant="warning" size="sm" className="text-[10px] py-0.5">
                  Pending Response
                </Badge>
              )}
            </div>

            <p className="text-xs text-[#64748B] truncate mt-0.5">
              {person?.headline ||
                (type === "incoming"
                  ? "Wants to connect with you"
                  : "Invitation awaiting response")}
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

            {/* Skills */}
            {person?.skills && person.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {person.skills.slice(0, 3).map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    size="sm"
                    className="text-[10px] py-0.5 px-2 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9] justify-end flex-wrap sm:flex-nowrap">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => person?.userId && onViewProfile(person.userId)}
            className="text-xs text-[#475569] hover:text-[#0A66C2]"
          >
            View Profile
          </Button>

          {type === "incoming" && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isBusy}
                onClick={() => onDecline?.(relId)}
                className="text-xs text-[#475569] hover:bg-slate-100"
              >
                Ignore
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isBusy}
                isLoading={isBusy}
                onClick={() => onAccept?.(relId)}
                className="text-xs shadow-xs"
              >
                Accept
              </Button>
            </>
          )}

          {type === "outgoing" && (
            <Button
              type="button"
              variant="quiet"
              size="sm"
              disabled={isBusy}
              isLoading={isBusy}
              onClick={() => onWithdraw?.(relId, name)}
              className="text-xs text-[#DC2626] hover:bg-red-50 hover:text-red-700"
            >
              Withdraw
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default InvitationCard;
