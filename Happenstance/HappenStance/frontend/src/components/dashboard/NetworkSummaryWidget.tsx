"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import type { Relationship, Profile } from "@/lib/api";

interface NetworkSummaryWidgetProps {
  incomingRequests: Relationship[];
  connectionsCount: number;
  profiles: Record<string, Profile>;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  busyId: string | null;
}

export function NetworkSummaryWidget({
  incomingRequests,
  connectionsCount,
  profiles,
  onAccept,
  onDecline,
  busyId,
}: NetworkSummaryWidgetProps) {
  return (
    <div className="space-y-5">
      {/* Pending Invitations Card */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <span>Invitations</span>
              {incomingRequests.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                  {incomingRequests.length}
                </span>
              )}
            </div>
          }
          action={
            incomingRequests.length > 0 ? (
              <Link href="/network" className="text-xs font-bold text-[#0A66C2] hover:underline">
                See all
              </Link>
            ) : null
          }
        />

        {incomingRequests.length > 0 ? (
          <div className="space-y-3.5">
            {incomingRequests.slice(0, 3).map((item) => {
              const relId = item.id || item.relationshipId || "";
              const senderId = item.sourceUserId || "";
              const sender = profiles[senderId];
              const isProcessing = busyId === relId;

              return (
                <div key={relId || senderId} className="space-y-2 pb-3 border-b border-[#F1F5F9] last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {(sender?.displayName || "M").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#0F172A] truncate">
                        {sender?.displayName || "HappenStance member"}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {sender?.headline || "Wants to connect"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={isProcessing}
                      disabled={isProcessing}
                      onClick={() => onDecline(relId)}
                      className="flex-1 text-xs py-1"
                    >
                      Ignore
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isProcessing}
                      disabled={isProcessing}
                      onClick={() => onAccept(relId)}
                      className="flex-1 text-xs py-1"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-[#64748B]">No pending invitations.</p>
          </div>
        )}
      </Card>

      {/* Network Navigation Shortcuts */}
      <Card>
        <CardHeader title="Network Intelligence" />
        <div className="space-y-2 text-xs">
          <Link
            href="/network"
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] font-semibold text-[#334155] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base text-[#0A66C2]">👥</span>
              <span>My Connections</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold text-[#0F172A] group-hover:bg-[#E8F3FC] group-hover:text-[#0A66C2]">
              {connectionsCount}
            </span>
          </Link>

          <Link
            href="/discover"
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] font-semibold text-[#334155] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base text-[#0A66C2]">🔍</span>
              <span>Discover People</span>
            </div>
            <span className="text-[#64748B] group-hover:text-[#0A66C2]">↗</span>
          </Link>

          <Link
            href="/graph"
            className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-[#E8F3FC]/70 to-white hover:bg-[#E8F3FC] font-semibold text-[#0A66C2] border border-[#BFDBFE] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🕸️</span>
              <span>Skill Network Graph</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A66C2] text-white font-bold group-hover:scale-105 transition-transform shadow-2xs">
              Explore ↗
            </span>
          </Link>

          <Link
            href="/recommendations"
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] font-semibold text-[#334155] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base text-[#0A66C2]">🎯</span>
              <span>Skills & Graph Matching</span>
            </div>
            <span className="text-[#64748B] group-hover:text-[#0A66C2]">↗</span>
          </Link>
        </div>

        {/* Intelligence Tip */}
        <div className="mt-4 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[11px] text-[#64748B] leading-relaxed">
          <span className="font-bold text-[#0F172A] block mb-0.5">💡 HappenStance Tip</span>
          Recommendations use graph-based scoring with shared skills, same industry, and mutual connections. Keep your skills updated to get higher-fidelity matches!
        </div>
      </Card>
    </div>
  );
}

export default NetworkSummaryWidget;
