"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import {
  getStoredUser,
  getToken,
  clearSession,
  asArray,
  type AuthUser,
  api,
  type Profile,
  type DiscoveryPage,
} from "@/lib/api";
import { MemberCard, type MemberConnectionStatus } from "@/components/discover/MemberCard";
import { MemberSkeletonCard } from "@/components/discover/MemberSkeletonCard";
import { SearchFiltersBar } from "@/components/discover/SearchFiltersBar";
import { PaginationBar } from "@/components/discover/PaginationBar";
import { ProfilePreviewModal } from "@/components/discover/ProfilePreviewModal";

const PAGE_SIZE = 12;

export default function DiscoverPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);

  // Search filter states
  const [keyword, setKeyword] = useState("");
  const [skill, setSkill] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Results & status states
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Relationship statuses
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [incomingIds, setIncomingIds] = useState<Set<string>>(new Set());

  // Profile Preview Modal
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Guard to prevent duplicate concurrent requests
  const isFetchingRef = useRef(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load existing network relationships to badge connection status
  const loadRelationships = useCallback(async () => {
    try {
      const [connectionsData, outgoingData, incomingData] = await Promise.allSettled([
        api.connections(),
        api.outgoingRequests(),
        api.incomingRequests(),
      ]);

      if (connectionsData.status === "fulfilled") {
        const connList = asArray(connectionsData.value);
        const cSet = new Set<string>();
        connList.forEach((r) => {
          if (r.sourceUserId) cSet.add(r.sourceUserId);
          if (r.targetUserId) cSet.add(r.targetUserId);
        });
        setConnectedIds(cSet);
      }

      if (outgoingData.status === "fulfilled") {
        const outList = asArray(outgoingData.value);
        const pSet = new Set<string>();
        outList.forEach((r) => {
          if (r.targetUserId) pSet.add(r.targetUserId);
        });
        setPendingIds(pSet);
      }

      if (incomingData.status === "fulfilled") {
        const inList = asArray(incomingData.value);
        const iSet = new Set<string>();
        inList.forEach((r) => {
          if (r.sourceUserId) iSet.add(r.sourceUserId);
        });
        setIncomingIds(iSet);
      }
    } catch {
      // Non-critical network status sync
    }
  }, []);

  // Primary search / discovery query
  const executeSearch = useCallback(
    async (
      targetPage = 0,
      kw = keyword,
      sk = skill,
      ind = industry,
      loc = location
    ) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const data = await api.discover({
          keyword: kw.trim() || undefined,
          skill: sk.trim() || undefined,
          industry: ind.trim() || undefined,
          location: loc.trim() || undefined,
          page: targetPage,
          size: PAGE_SIZE,
        });

        if (Array.isArray(data)) {
          setResults(data);
          setTotalElements(data.length);
          setTotalPages(Math.ceil(data.length / PAGE_SIZE) || 1);
          setPage(targetPage);
        } else {
          const pageData = data as DiscoveryPage;
          setResults(pageData.content || []);
          setTotalElements(pageData.totalElements ?? (pageData.content?.length || 0));
          setTotalPages(pageData.totalPages ?? 1);
          setPage(pageData.number ?? targetPage);
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Unable to retrieve members from HappenStance.";
        setError(msg);
        setResults([]);
        toast(msg, "error");
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [keyword, skill, industry, location, toast]
  );

  // Initial mount: verify auth, load relationships, load first page
  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();

    if (!stored || !token) {
      router.push("/login");
      return;
    }

    setUser(stored);
    void loadRelationships();
    void executeSearch(0);
  }, [router, loadRelationships, executeSearch]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void executeSearch(0);
  };

  const handleClearAllFilters = () => {
    setKeyword("");
    setSkill("");
    setIndustry("");
    setLocation("");
    void executeSearch(0, "", "", "", "");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 0 || newPage >= totalPages) return;
    void executeSearch(newPage);
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleConnect = async (targetUserId: string, name?: string) => {
    if (connectingIds.has(targetUserId) || pendingIds.has(targetUserId) || connectedIds.has(targetUserId)) {
      return;
    }

    setConnectingIds((prev) => new Set(prev).add(targetUserId));

    try {
      await api.sendConnection(targetUserId);
      setPendingIds((prev) => new Set(prev).add(targetUserId));
      toast(`Connection request sent to ${name || "member"}!`, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to send request.";
      toast(msg, "error");
    } finally {
      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const handleViewProfile = async (userId: string) => {
    setPreviewLoading(true);
    setSelectedProfile(null);

    try {
      const person = await api.publicProfile(userId);
      setSelectedProfile(person);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Unable to load profile details.",
        "error"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const getMemberStatus = (userId: string): MemberConnectionStatus => {
    if (connectedIds.has(userId)) return "CONNECTED";
    if (pendingIds.has(userId)) return "PENDING";
    if (incomingIds.has(userId)) return "INCOMING";
    return "NONE";
  };

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      <Navbar user={user} activeTab="discover" onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Top Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Discover People
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Explore public profiles, search by skills and industry, and build high-intention professional connections.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <SearchFiltersBar
          keyword={keyword}
          skill={skill}
          industry={industry}
          location={location}
          onKeywordChange={setKeyword}
          onSkillChange={setSkill}
          onIndustryChange={setIndustry}
          onLocationChange={setLocation}
          onSubmit={handleFormSubmit}
          onClearAll={handleClearAllFilters}
          loading={loading}
          totalResults={totalElements}
        />

        {/* Backend Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-bold text-red-950">Discovery Service Unavailable</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeSearch(page)}
              className="text-xs bg-white text-red-800 border-red-300 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Results Container */}
        <div ref={resultsContainerRef} className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
            <span>
              {loading ? (
                "Searching HappenStance network..."
              ) : (
                <>
                  Found <span className="text-[#0F172A] font-bold">{totalElements}</span> public profiles
                </>
              )}
            </span>
            {totalPages > 1 && (
              <span className="text-[11px] text-[#94A3B8]">
                Page {page + 1} of {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            /* Skeleton Loading State */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <MemberSkeletonCard key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            /* Populated Member Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {results.map((person) => (
                <MemberCard
                  key={person.userId}
                  person={person}
                  connectionStatus={getMemberStatus(person.userId)}
                  isConnecting={connectingIds.has(person.userId)}
                  onConnect={handleConnect}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">
                No public profiles match your criteria
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                Try searching with broader keywords, clearing specific filters, or searching by individual skills.
              </p>
              {(keyword || skill || industry || location) && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllFilters}
                    className="text-xs"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Server-Side Pagination Bar */}
          {!loading && results.length > 0 && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          )}
        </div>
      </main>

      {/* Member Profile Preview Dialog */}
      <ProfilePreviewModal
        profile={selectedProfile}
        loading={previewLoading}
        onClose={() => setSelectedProfile(null)}
        connectionStatus={
          selectedProfile ? getMemberStatus(selectedProfile.userId) : "NONE"
        }
        isConnecting={
          selectedProfile ? connectingIds.has(selectedProfile.userId) : false
        }
        onConnect={handleConnect}
      />
    </div>
  );
}
