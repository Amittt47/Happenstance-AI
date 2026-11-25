"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { MatchingIntelligenceCard } from "@/components/recommendations/MatchingIntelligenceCard";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { RecommendationSkeleton } from "@/components/recommendations/RecommendationSkeleton";
import { MatchBreakdownModal } from "@/components/recommendations/MatchBreakdownModal";
import { ProfilePreviewModal } from "@/components/discover/ProfilePreviewModal";
import {
  getStoredUser,
  getToken,
  clearSession,
  api,
  asArray,
  type AuthUser,
  type Profile,
  type Recommendation,
  type Relationship,
} from "@/lib/api";

export default function RecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [outgoingIds, setOutgoingIds] = useState<Set<string>>(new Set());
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [incomingCount, setIncomingCount] = useState(0);

  const [limit, setLimit] = useState(10);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());

  // Modal states
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Recommendation | null>(null);

  // Fetch recommendations and network status
  const loadRecommendations = useCallback(
    async (requestedLimit = limit) => {
      setLoading(true);
      setError(null);

      try {
        const [recRes, outRes, inRes, connRes] = await Promise.allSettled([
          api.recommendations(requestedLimit),
          api.outgoingRequests(),
          api.incomingRequests(),
          api.connections(),
        ]);

        if (recRes.status === "fulfilled") {
          setRecommendations(asArray(recRes.value));
        } else {
          throw new Error("Unable to load recommendations from server.");
        }

        if (outRes.status === "fulfilled") {
          const outList = asArray(outRes.value);
          const requestedSet = new Set(
            outList
              .map((r: Relationship) => r.targetUserId)
              .filter((id): id is string => Boolean(id))
          );
          setOutgoingIds(requestedSet);
        }

        if (inRes.status === "fulfilled") {
          setIncomingCount(asArray(inRes.value).length);
        }

        if (connRes.status === "fulfilled") {
          setConnectionsCount(asArray(connRes.value).length);
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load recommendations.";
        setError(msg);
        toast(msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [limit, toast]
  );

  // Auth check and initial load
  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();

    if (!stored || !token) {
      router.push("/login");
      return;
    }

    setUser(stored);
    void loadRecommendations(limit);
  }, [router, loadRecommendations, limit]);

  // Connect action handler
  const handleConnect = async (targetUserId: string, name?: string) => {
    setConnectingIds((prev) => new Set(prev).add(targetUserId));

    try {
      await api.sendConnection(targetUserId);
      setOutgoingIds((prev) => new Set(prev).add(targetUserId));
      toast(
        `Connection request sent to ${name || "member"}!`,
        "success"
      );
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : "Could not send connection request.",
        "error"
      );
    } finally {
      setConnectingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(targetUserId);
        return updated;
      });
    }
  };

  // View profile in reusable modal
  const handleViewProfile = async (targetUserId: string) => {
    // If recommendation is in memory, pre-populate
    const found = recommendations.find((r) => r.userId === targetUserId);
    if (found) {
      setSelectedProfile(found);
      return;
    }

    setProfileLoading(true);
    setSelectedProfile(null);
    try {
      const fullProfile = await api.publicProfile(targetUserId);
      setSelectedProfile(fullProfile);
    } catch {
      toast("Could not load full profile details.", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  // Filter recommendations by client-side keyword
  const filteredRecommendations = useMemo(() => {
    if (!filterKeyword.trim()) return recommendations;
    const term = filterKeyword.toLowerCase().trim();

    return recommendations.filter((r) => {
      const text = [
        r.displayName,
        r.headline,
        r.location,
        r.industry,
        ...(r.skills || []),
        ...(r.interests || []),
        ...(r.reasons || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [recommendations, filterKeyword]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <Navbar
        user={user}
        activeTab="recommendations"
        incomingCount={incomingCount}
        connectionsCount={connectionsCount}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Intelligence & Discovery Banner */}
        <MatchingIntelligenceCard />

        {/* Feed Header and Controls Bar */}
        <Card className="p-4 sm:p-5 shadow-xs border-[#E2E8F0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <span>Recommended For You</span>
                {!loading && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F3FC] text-[#0A66C2]">
                    {filteredRecommendations.length} Found
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Calculated by HappenStance matching algorithm using shared skills, mutual network & interests
              </p>
            </div>

            {/* Quick Filter & Limit Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="Filter by skill, role..."
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition-all w-44"
              />

              <div className="flex items-center gap-1 border border-[#E2E8F0] rounded-lg p-0.5 bg-[#F8FAFC]">
                <span className="text-[11px] font-semibold text-[#64748B] px-2 hidden sm:inline">
                  Show:
                </span>
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setLimit(num);
                      void loadRecommendations(num);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all focus:outline-none ${
                      limit === num
                        ? "bg-white text-[#0A66C2] shadow-2xs border border-[#CBD5E1]"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void loadRecommendations(limit)}
                isLoading={loading}
                className="text-xs"
              >
                Refresh ↻
              </Button>
            </div>
          </div>
        </Card>

        {/* Recommendations Content Feed */}
        <section aria-labelledby="recommendations-heading" className="space-y-3">
          <h2 id="recommendations-heading" className="sr-only">
            List of Recommended Professionals
          </h2>

          {loading ? (
            <div className="space-y-3">
              <RecommendationSkeleton />
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </div>
          ) : error ? (
            <Card className="py-12 px-6 text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  !
                </div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  Failed to Load Recommendations
                </h3>
                <p className="text-xs text-[#64748B]">{error}</p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void loadRecommendations(limit)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          ) : filteredRecommendations.length > 0 ? (
            <div className="space-y-3">
              {filteredRecommendations.map((person) => {
                const isRequested = outgoingIds.has(person.userId);
                const isConnecting = connectingIds.has(person.userId);

                return (
                  <RecommendationCard
                    key={person.userId}
                    recommendation={person}
                    isConnecting={isConnecting}
                    isRequested={isRequested}
                    onConnect={handleConnect}
                    onViewProfile={handleViewProfile}
                    onViewBreakdown={(rec) => setSelectedBreakdown(rec)}
                  />
                );
              })}
            </div>
          ) : (
            <Card className="py-14 px-6 text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  {filterKeyword
                    ? "No recommendations matched your filter"
                    : "No recommendations available right now"}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {filterKeyword
                    ? "Try adjusting your search filter or clear it to see all available suggestions."
                    : "Recommendations are dynamically generated when you add skills, interests, and industry to your profile."}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  {filterKeyword ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setFilterKeyword("")}
                    >
                      Clear Filter
                    </Button>
                  ) : (
                    <>
                      <Link href="/profile">
                        <Button variant="primary" size="sm">
                          Update Your Profile
                        </Button>
                      </Link>
                      <Link href="/discover">
                        <Button variant="secondary" size="sm">
                          Browse Discover
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}
        </section>
      </main>

      {/* Match Breakdown Modal */}
      <MatchBreakdownModal
        recommendation={selectedBreakdown}
        onClose={() => setSelectedBreakdown(null)}
        isConnecting={
          selectedBreakdown ? connectingIds.has(selectedBreakdown.userId) : false
        }
        isRequested={
          selectedBreakdown ? outgoingIds.has(selectedBreakdown.userId) : false
        }
        onConnect={handleConnect}
      />

      {/* Profile Preview Modal (Reused from Phase 5) */}
      <ProfilePreviewModal
        profile={selectedProfile}
        loading={profileLoading}
        onClose={() => {
          setSelectedProfile(null);
          setProfileLoading(false);
        }}
        connectionStatus={
          selectedProfile && outgoingIds.has(selectedProfile.userId)
            ? "PENDING"
            : "NONE"
        }
        isConnecting={
          selectedProfile ? connectingIds.has(selectedProfile.userId) : false
        }
        onConnect={handleConnect}
      />
    </div>
  );
}
