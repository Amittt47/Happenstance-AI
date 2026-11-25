"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";

export function MatchingIntelligenceCard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/discover");
    }
  };

  return (
    <Card className="p-5 sm:p-6 shadow-xs border-[#E2E8F0] bg-white">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">
                HappenStance Matching Intelligence
              </h3>
              <p className="text-xs text-[#64748B]">
                Graph-informed multi-factor scoring based on verified network proximity & competencies
              </p>
            </div>
          </div>

          <Link href="/discover">
            <Button variant="quiet" size="sm" className="text-xs text-[#0A66C2] hover:underline">
              Open Advanced Discovery ↗
            </Button>
          </Link>
        </div>

        {/* Discovery Input Form */}
        <form onSubmit={handleSearchSubmit} className="pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find professionals by skills (e.g. Distributed Systems, Next.js, AI)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto text-xs px-5 shadow-xs"
            >
              Explore Discover
            </Button>
          </div>
        </form>

        {/* Transparent Matching Factors Overview */}
        <div className="pt-2 border-t border-[#F1F5F9]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
            Backend Scoring Criteria
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs font-bold text-[#0F172A]">Shared Skills</div>
              <div className="text-[10px] text-[#0A66C2] font-semibold mt-0.5">Up to 30 pts</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs font-bold text-[#0F172A]">Mutual Graph</div>
              <div className="text-[10px] text-[#0A66C2] font-semibold mt-0.5">Up to 24 pts</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs font-bold text-[#0F172A]">Interests</div>
              <div className="text-[10px] text-[#0A66C2] font-semibold mt-0.5">Up to 20 pts</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs font-bold text-[#0F172A]">Industry</div>
              <div className="text-[10px] text-[#0A66C2] font-semibold mt-0.5">+15 pts</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] col-span-2 sm:col-span-1">
              <div className="text-xs font-bold text-[#0F172A]">Location</div>
              <div className="text-[10px] text-[#0A66C2] font-semibold mt-0.5">+10 pts</div>
            </div>
          </div>
        </div>

        {/* System Capability Notice */}
        <div className="bg-[#F8FAFC] rounded-lg p-3 text-xs text-[#64748B] flex items-start gap-2 border border-[#E2E8F0]">
          <span className="text-[#0A66C2] font-bold text-sm leading-none mt-0.5">ℹ</span>
          <p className="leading-relaxed">
            <strong className="text-[#334155]">Engine Architecture:</strong> Ranked recommendations are computed using Spring Boot&apos;s relationship graph adjacency and profile vector matching. Conversational LLM discovery is planned for future releases.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default MatchingIntelligenceCard;
