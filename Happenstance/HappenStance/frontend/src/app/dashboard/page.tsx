"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { useToast } from "@/components/common/Toast";
import { ProfileOverviewCard } from "@/components/dashboard/ProfileOverviewCard";
import { RecommendationsFeed } from "@/components/dashboard/RecommendationsFeed";
import { NetworkSummaryWidget } from "@/components/dashboard/NetworkSummaryWidget";
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

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<Relationship[]>([]);
  const [incoming, setIncoming] = useState<Relationship[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, Profile>>({});

  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [busyRelationshipId, setBusyRelationshipId] = useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, inRes, rRes] = await Promise.allSettled([
        api.me(),
        api.connections(),
        api.incomingRequests(),
        api.recommendations(10),
      ]);

      if (pRes.status === "fulfilled") setProfile(pRes.value);

      const connList = cRes.status === "fulfilled" ? asArray(cRes.value) : [];
      const inList = inRes.status === "fulfilled" ? asArray(inRes.value) : [];
      setConnections(connList);
      setIncoming(inList);

      if (rRes.status === "fulfilled") setRecommendations(rRes.value);

      // Track already requested or connected IDs
      const connectedSet = new Set<string>();
      connList.forEach((r) => {
        if (r.sourceUserId) connectedSet.add(r.sourceUserId);
        if (r.targetUserId) connectedSet.add(r.targetUserId);
      });
      setConnectedIds(connectedSet);

      // Fetch batch member profiles for incoming senders
      const senderIds = inList.map((r) => r.sourceUserId).filter((id): id is string => Boolean(id));
      if (senderIds.length > 0) {
        const fetched = await api.publicProfiles(senderIds);
        const map: Record<string, Profile> = {};
        fetched.forEach((p) => {
          map[p.userId] = p;
        });
        setMemberProfiles((prev) => ({ ...prev, ...map }));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();

    if (!stored || !token) {
      router.push("/login");
      return;
    }

    setUser(stored);
    void loadDashboardData();
  }, [router, loadDashboardData]);

  const handleRefreshRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const fresh = await api.recommendations(10);
      setRecommendations(fresh);
      toast("Recommendations refreshed!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not refresh recommendations.", "error");
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleConnect = async (targetUserId: string, name?: string) => {
    setConnectingIds((prev) => new Set(prev).add(targetUserId));
    try {
      await api.sendConnection(targetUserId);
      setConnectedIds((prev) => new Set(prev).add(targetUserId));
      toast(`Connection invitation sent to ${name || "member"}!`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to send connection request.", "error");
    } finally {
      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const handleAccept = async (relationshipId: string) => {
    setBusyRelationshipId(relationshipId);
    try {
      await api.acceptConnection(relationshipId);
      toast("Connection accepted!", "success");
      await loadDashboardData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to accept connection.", "error");
    } finally {
      setBusyRelationshipId(null);
    }
  };

  const handleDecline = async (relationshipId: string) => {
    setBusyRelationshipId(relationshipId);
    try {
      await api.rejectConnection(relationshipId);
      toast("Invitation declined.", "info");
      await loadDashboardData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to decline invitation.", "error");
    } finally {
      setBusyRelationshipId(null);
    }
  };

  const handleViewProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const person = await api.publicProfile(userId);
      setSelectedProfile(person);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not load public profile.", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <Navbar
        user={user}
        activeTab="home"
        incomingCount={incoming.length}
        connectionsCount={connections.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* 3-Column LinkedIn-Style Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Profile Card (3 cols on desktop) */}
          <div className="md:col-span-4 lg:col-span-3 order-1 md:order-1">
            <ProfileOverviewCard
              user={user}
              profile={profile}
              connectionsCount={connections.length}
            />
          </div>

          {/* Center Column: Recommendations & Discover (6 cols on desktop) */}
          <div className="md:col-span-8 lg:col-span-6 order-2 md:order-2 space-y-4">
            <RecommendationsFeed
              recommendations={recommendations}
              loading={loading || recommendationsLoading}
              onRefresh={handleRefreshRecommendations}
              onConnect={handleConnect}
              onViewProfile={handleViewProfile}
              connectingIds={connectingIds}
              connectedIds={connectedIds}
            />
          </div>

          {/* Right Column: Invitations & Quick Links (3 cols on desktop) */}
          <div className="md:col-span-12 lg:col-span-3 order-3 md:order-3">
            <NetworkSummaryWidget
              incomingRequests={incoming}
              connectionsCount={connections.length}
              profiles={memberProfiles}
              onAccept={handleAccept}
              onDecline={handleDecline}
              busyId={busyRelationshipId}
            />
          </div>
        </div>
      </main>

      {/* Public Profile Detail Modal */}
      {selectedProfile && (
        <Modal
          isOpen={Boolean(selectedProfile)}
          onClose={() => setSelectedProfile(null)}
          kicker="HappenStance Member"
          title={selectedProfile.displayName || "Professional Profile"}
          subtitle={selectedProfile.headline || "HappenStance member"}
        >
          {profileLoading ? (
            <div className="py-8 text-center text-sm text-[#64748B]">Loading profile...</div>
          ) : (
            <div className="space-y-4 text-sm">
              {selectedProfile.bio && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">About</h4>
                  <p className="text-[#334155] leading-relaxed">{selectedProfile.bio}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">Details</h4>
                <p className="text-[#334155]">
                  {[selectedProfile.industry, selectedProfile.location].filter(Boolean).join(" · ") || "Not specified"}
                </p>
              </div>

              {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1.5">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.skills.map((s) => (
                      <Badge key={s} variant="primary" size="sm">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1.5">Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.interests.map((i) => (
                      <Badge key={i} variant="secondary" size="sm">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#F1F5F9] flex justify-end gap-2">
                <Button variant="secondary" size="md" onClick={() => setSelectedProfile(null)}>
                  Close
                </Button>
                {selectedProfile.userId !== user?.id && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      handleConnect(selectedProfile.userId, selectedProfile.displayName);
                      setSelectedProfile(null);
                    }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
