"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { api, type Profile, type MutualConnectionsResponse } from "@/lib/api";
import type { MemberConnectionStatus } from "./MemberCard";

interface ProfilePreviewModalProps {
  profile: Profile | null;
  loading: boolean;
  onClose: () => void;
  connectionStatus: MemberConnectionStatus;
  isConnecting: boolean;
  onConnect: (userId: string, name?: string) => void;
}

export function ProfilePreviewModal({
  profile,
  loading,
  onClose,
  connectionStatus,
  isConnecting,
  onConnect,
}: ProfilePreviewModalProps) {
  const [mutualData, setMutualData] = useState<MutualConnectionsResponse | null>(null);
  const [loadingMutual, setLoadingMutual] = useState(false);

  useEffect(() => {
    let active = true;
    if (profile?.userId) {
      setLoadingMutual(true);
      api
        .mutualConnections(profile.userId)
        .then((res) => {
          if (active) setMutualData(res);
        })
        .catch(() => {
          if (active) setMutualData({ count: 0, mutualConnections: [] });
        })
        .finally(() => {
          if (active) setLoadingMutual(false);
        });
    } else {
      setMutualData(null);
    }
    return () => {
      active = false;
    };
  }, [profile?.userId]);
  if (!profile && !loading) return null;

  const initial = (profile?.displayName || profile?.headline || "M")
    .slice(0, 1)
    .toUpperCase();

  const metaDetails = [profile?.location, profile?.industry]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal
      isOpen={Boolean(profile || loading)}
      onClose={onClose}
      maxWidth="lg"
      kicker="HAPPENSTANCE MEMBER"
      title={profile?.displayName || "Member Profile"}
      subtitle={profile?.headline || "Professional details"}
    >
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748B]">Loading member profile...</p>
        </div>
      ) : profile ? (
        <div className="space-y-5 text-sm">
          {/* Header Banner & Avatar */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-[#0F172A] truncate">
                {profile.displayName || "HappenStance Member"}
              </h3>
              <p className="text-xs text-[#475569] mt-0.5 line-clamp-2">
                {profile.headline || "Professional member on HappenStance"}
              </p>
              {metaDetails && (
                <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-[#0A66C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {metaDetails}
                </p>
              )}
            </div>
          </div>

          {/* Mutual Connections Section */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#0A66C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Mutual Connections</span>
              </h4>
              {mutualData && (
                <Badge variant={mutualData.count > 0 ? "primary" : "neutral"} size="sm">
                  {mutualData.count} {mutualData.count === 1 ? "mutual" : "mutuals"}
                </Badge>
              )}
            </div>

            {loadingMutual ? (
              <div className="flex items-center gap-2 py-2 text-xs text-[#64748B]">
                <div className="w-3.5 h-3.5 border-2 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
                <span>Checking mutual network...</span>
              </div>
            ) : mutualData && mutualData.count > 0 ? (
              <div className="space-y-2 mt-2">
                <div className="flex flex-wrap gap-2">
                  {mutualData.mutualConnections.map((mutual) => (
                    <div
                      key={mutual.userId}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg shadow-2xs text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#E8F3FC] text-[#0A66C2] font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                        {(mutual.displayName || "M").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#0F172A] truncate block">
                          {mutual.displayName}
                        </span>
                        {mutual.headline && (
                          <span className="text-[10px] text-[#64748B] truncate block max-w-[180px]">
                            {mutual.headline}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic">
                No mutual connections yet. Connect to expand your shared network!
              </p>
            )}
          </div>

          {/* About / Bio */}
          {profile.bio && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1.5">
                About
              </h4>
              <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
                <span>Skills & Competencies</span>
                <span className="text-[11px] font-normal text-[#94A3B8]">
                  ({profile.skills.length})
                </span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="primary" size="md">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
                <span>Interests & Focus Areas</span>
                <span className="text-[11px] font-normal text-[#94A3B8]">
                  ({profile.interests.length})
                </span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" size="md">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dialog Action Footer */}
          <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>

            {connectionStatus === "CONNECTED" ? (
              <Button variant="secondary" size="md" disabled className="bg-emerald-50 text-emerald-700 border-emerald-200">
                ✓ Connected
              </Button>
            ) : connectionStatus === "PENDING" ? (
              <Button variant="outline" size="md" disabled>
                ⏳ Requested
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={isConnecting}
                disabled={isConnecting}
                onClick={() => onConnect(profile.userId, profile.displayName)}
                className="min-w-[120px]"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default ProfilePreviewModal;
