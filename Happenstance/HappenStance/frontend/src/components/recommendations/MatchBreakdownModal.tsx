"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import type { Recommendation } from "@/lib/api";

interface MatchBreakdownModalProps {
  recommendation: Recommendation | null;
  onClose: () => void;
  isConnecting?: boolean;
  isRequested?: boolean;
  onConnect: (userId: string, name?: string) => void;
}

export function MatchBreakdownModal({
  recommendation,
  onClose,
  isConnecting = false,
  isRequested = false,
  onConnect,
}: MatchBreakdownModalProps) {
  if (!recommendation) return null;

  const name = recommendation.displayName || "HappenStance Member";
  const score = recommendation.score;

  return (
    <Modal
      isOpen={Boolean(recommendation)}
      onClose={onClose}
      maxWidth="lg"
      kicker="MATCH INTELLIGENCE"
      title={`Match Analysis: ${name}`}
      subtitle={`Overall Match Score: ${score}%`}
    >
      <div className="space-y-5 text-sm pt-1">
        {/* Score Overview Banner */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Scoring Model
            </div>
            <p className="text-xs text-[#334155] mt-0.5">
              Multi-factor heuristic scoring based on graph network proximity and shared profile attributes.
            </p>
          </div>
          <div className="text-center px-3 py-1.5 bg-[#E8F3FC] border border-[#BAE0FD] rounded-lg flex-shrink-0">
            <span className="text-xl font-bold text-[#0A66C2]">{score}%</span>
            <span className="block text-[10px] text-[#0A66C2] font-semibold uppercase">
              Match
            </span>
          </div>
        </div>

        {/* Backend Calculated Reasons */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#0F172A] mb-2 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-[#0A66C2]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Calculated Matching Factors</span>
          </h4>

          {recommendation.reasons && recommendation.reasons.length > 0 ? (
            <div className="space-y-2">
              {recommendation.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#E8F3FC] text-[#0A66C2] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">{reason}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Verified positive correlation with your profile.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B]">
              General profile alignment based on public network activity.
            </p>
          )}
        </div>

        {/* Skills Breakdown */}
        {recommendation.skills && recommendation.skills.length > 0 && (
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-2">
              Candidate Skills ({recommendation.skills.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {recommendation.skills.map((skill) => (
                <Badge key={skill} variant="primary" size="md">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Interests Breakdown */}
        {recommendation.interests && recommendation.interests.length > 0 && (
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-2">
              Candidate Interests & Focus Areas ({recommendation.interests.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {recommendation.interests.map((interest) => (
                <Badge key={interest} variant="secondary" size="md">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={isConnecting || isRequested}
            isLoading={isConnecting}
            onClick={() => onConnect(recommendation.userId, name)}
          >
            {isRequested ? "✓ Connection Requested" : "Connect Now"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default MatchBreakdownModal;
