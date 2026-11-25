"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/common/Card";

interface NetworkStatsCardProps {
  connectionsCount: number;
  incomingCount: number;
  outgoingCount: number;
  activeTab: "connections" | "incoming" | "outgoing";
  onTabSelect: (tab: "connections" | "incoming" | "outgoing") => void;
}

export function NetworkStatsCard({
  connectionsCount,
  incomingCount,
  outgoingCount,
  activeTab,
  onTabSelect,
}: NetworkStatsCardProps) {
  return (
    <Card className="p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Metric Pill Buttons */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1">
          {/* Connections */}
          <button
            type="button"
            onClick={() => onTabSelect("connections")}
            className={`p-3 rounded-xl border text-center transition-all focus:outline-none ${
              activeTab === "connections"
                ? "bg-[#E8F3FC] border-[#0A66C2] ring-2 ring-[#0A66C2]/20"
                : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]"
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              {connectionsCount}
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-0.5 uppercase tracking-wider truncate">
              Connections
            </div>
          </button>

          {/* Incoming */}
          <button
            type="button"
            onClick={() => onTabSelect("incoming")}
            className={`p-3 rounded-xl border text-center transition-all relative focus:outline-none ${
              activeTab === "incoming"
                ? "bg-[#E8F3FC] border-[#0A66C2] ring-2 ring-[#0A66C2]/20"
                : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]"
            }`}
          >
            {incomingCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            )}
            <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              {incomingCount}
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-0.5 uppercase tracking-wider truncate">
              Received
            </div>
          </button>

          {/* Outgoing */}
          <button
            type="button"
            onClick={() => onTabSelect("outgoing")}
            className={`p-3 rounded-xl border text-center transition-all focus:outline-none ${
              activeTab === "outgoing"
                ? "bg-[#E8F3FC] border-[#0A66C2] ring-2 ring-[#0A66C2]/20"
                : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]"
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              {outgoingCount}
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-0.5 uppercase tracking-wider truncate">
              Sent
            </div>
          </button>
        </div>

        {/* Discover Shortcut */}
        <div className="pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[#F1F5F9] sm:pl-5 flex flex-col justify-center items-start sm:items-end">
          <p className="text-xs text-[#64748B]">Expand your circles</p>
          <Link
            href="/discover"
            className="text-xs font-bold text-[#0A66C2] hover:underline flex items-center gap-1 mt-0.5"
          >
            <span>Discover more people</span>
            <span>↗</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default NetworkStatsCard;
