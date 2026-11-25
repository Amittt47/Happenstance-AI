"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { NetworkStatsCard } from "@/components/network/NetworkStatsCard";
import { ConnectionCard } from "@/components/network/ConnectionCard";
import { InvitationCard } from "@/components/network/InvitationCard";
import { NetworkSkeletonCard } from "@/components/network/NetworkSkeletonCard";
import { ConfirmActionModal } from "@/components/network/ConfirmActionModal";
import { ProfilePreviewModal } from "@/components/discover/ProfilePreviewModal";
import {
  getStoredUser,
  getToken,
  clearSession,
  type AuthUser,
  api,
  asArray,
  type Profile,
  type Relationship,
} from "@/lib/api";

type TabType = "connections" | "incoming" | "outgoing";

export default function NetworkPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("connections");

  const [connections, setConnections] = useState<Relationship[]>([]);
  const [incoming, setIncoming] = useState<Relationship[]>([]);
  const [outgoing, setOutgoing] = useState<Relationship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const [loading, setLoading] = useState(true);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "remove" | "withdraw";
    relationshipId: string;
    targetName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: "remove",
    relationshipId: "",
    targetName: "",
    isLoading: false,
  });

  // Profile preview modal state
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch network data and enrich with public profiles
  const loadNetworkData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);

    try {
      const [cRes, inRes, outRes] = await Promise.allSettled([
        api.connections(),
        api.incomingRequests(),
        api.outgoingRequests(),
      ]);

      const cList = cRes.status === "fulfilled" ? asArray(cRes.value) : [];
      const inList = inRes.status === "fulfilled" ? asArray(inRes.value) : [];
      const outList = outRes.status === "fulfilled" ? asArray(outRes.value) : [];

      setConnections(cList);
      setIncoming(inList);
      setOutgoing(outList);

      const currentUserId = getStoredUser()?.id || "";
      const relatedIds = [
        ...cList.map((r) =>
          r.sourceUserId === currentUserId ? r.targetUserId : r.sourceUserId
        ),
        ...inList.map((r) => r.sourceUserId),
        ...outList.map((r) => r.targetUserId),
      ].filter((id): id is string => Boolean(id));

      if (relatedIds.length > 0) {
        const fetchedProfiles = await api.publicProfiles(relatedIds);
        const map: Record<string, Profile> = {};
        fetchedProfiles.forEach((p) => {
          map[p.userId] = p;
        });
        setProfiles((prev) => ({ ...prev, ...map }));
      }
    } catch (err) {
      if (!quiet) {
        toast(
          err instanceof Error ? err.message : "Failed to load network.",
          "error"
        );
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [toast]);

  // Auth gate
  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();

    if (!stored || !token) {
      router.push("/login");
      return;
    }

    setUser(stored);
    void loadNetworkData();
  }, [router, loadNetworkData]);

  // Open profile preview dialog
  const handleViewProfile = async (targetUserId: string) => {
    if (profiles[targetUserId]) {
      setPreviewProfile(profiles[targetUserId]);
      return;
    }

    setPreviewLoading(true);
    setPreviewProfile(null);
    try {
      const profile = await api.publicProfile(targetUserId);
      setProfiles((prev) => ({ ...prev, [targetUserId]: profile }));
      setPreviewProfile(profile);
    } catch {
      toast("Could not load member profile details.", "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCloseProfileModal = () => {
    setPreviewProfile(null);
    setPreviewLoading(false);
  };

  // Accept incoming invitation
  const handleAccept = async (relationshipId: string) => {
    setBusyActionId(relationshipId);
    try {
      await api.acceptConnection(relationshipId);
      toast("Connection accepted! Added to your network.", "success");

      // Optimistic update: move item from incoming to connections
      const acceptedItem = incoming.find(
        (r) => (r.id || r.relationshipId) === relationshipId
      );
      setIncoming((prev) =>
        prev.filter((r) => (r.id || r.relationshipId) !== relationshipId)
      );
      if (acceptedItem) {
        setConnections((prev) => [
          { ...acceptedItem, status: "ACCEPTED" },
          ...prev,
        ]);
      }

      // Re-fetch in background
      void loadNetworkData(true);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not accept request.",
        "error"
      );
    } finally {
      setBusyActionId(null);
    }
  };

  // Ignore/Decline incoming invitation
  const handleDecline = async (relationshipId: string) => {
    setBusyActionId(relationshipId);
    try {
      await api.rejectConnection(relationshipId);
      toast("Invitation ignored.", "info");

      // Optimistic update: remove from incoming
      setIncoming((prev) =>
        prev.filter((r) => (r.id || r.relationshipId) !== relationshipId)
      );

      // Re-fetch in background
      void loadNetworkData(true);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not decline request.",
        "error"
      );
    } finally {
      setBusyActionId(null);
    }
  };

  // Open modal to confirm connection removal
  const openRemoveModal = (relationshipId: string, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      type: "remove",
      relationshipId,
      targetName: memberName,
      isLoading: false,
    });
  };

  // Open modal to confirm invitation withdrawal
  const openWithdrawModal = (relationshipId: string, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      type: "withdraw",
      relationshipId,
      targetName: memberName,
      isLoading: false,
    });
  };

  // Confirm action execution (Remove or Withdraw)
  const handleConfirmAction = async () => {
    const { type, relationshipId, targetName } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await api.removeConnection(relationshipId);

      if (type === "remove") {
        toast(`Removed ${targetName} from your network.`, "info");
        // Optimistic removal from connections
        setConnections((prev) =>
          prev.filter((r) => (r.id || r.relationshipId) !== relationshipId)
        );
      } else {
        toast(`Withdrew invitation to ${targetName}.`, "info");
        // Optimistic removal from outgoing
        setOutgoing((prev) =>
          prev.filter((r) => (r.id || r.relationshipId) !== relationshipId)
        );
      }

      setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
      // Background sync
      void loadNetworkData(true);
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : `Failed to ${type === "remove" ? "remove connection" : "withdraw invitation"}.`,
        "error"
      );
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  // Determine preview modal connection status
  const previewStatus = (): "CONNECTED" | "PENDING" | "NONE" => {
    if (!previewProfile) return "NONE";
    const currentUserId = user?.id || "";

    const isConnected = connections.some(
      (r) =>
        (r.sourceUserId === previewProfile.userId &&
          r.targetUserId === currentUserId) ||
        (r.targetUserId === previewProfile.userId &&
          r.sourceUserId === currentUserId)
    );
    if (isConnected) return "CONNECTED";

    const isPending =
      incoming.some((r) => r.sourceUserId === previewProfile.userId) ||
      outgoing.some((r) => r.targetUserId === previewProfile.userId);
    if (isPending) return "PENDING";

    return "NONE";
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <Navbar
        user={user}
        activeTab="network"
        incomingCount={incoming.length}
        connectionsCount={connections.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Metric & Navigation Bar */}
        <NetworkStatsCard
          connectionsCount={connections.length}
          incomingCount={incoming.length}
          outgoingCount={outgoing.length}
          activeTab={activeTab}
          onTabSelect={(tab) => setActiveTab(tab)}
        />

        {/* Tab Header Tabs */}
        <Card className="p-0 overflow-hidden shadow-xs border-[#E2E8F0]">
          <div className="flex border-b border-[#E2E8F0] bg-white">
            <button
              type="button"
              onClick={() => setActiveTab("connections")}
              className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all focus:outline-none ${
                activeTab === "connections"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-[#F8FAFC]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]/50"
              }`}
            >
              Connections ({connections.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("incoming")}
              className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all relative focus:outline-none ${
                activeTab === "incoming"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-[#F8FAFC]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]/50"
              }`}
            >
              Invitations Received ({incoming.length})
              {incoming.length > 0 && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-[#DC2626]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("outgoing")}
              className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all focus:outline-none ${
                activeTab === "outgoing"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-[#F8FAFC]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]/50"
              }`}
            >
              Invitations Sent ({outgoing.length})
            </button>
          </div>
        </Card>

        {/* Tab 1: Accepted Connections */}
        {activeTab === "connections" && (
          <section aria-labelledby="connections-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="connections-heading"
                  className="text-lg font-bold text-[#0F172A]"
                >
                  Your Network Connections ({connections.length})
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Verified professionals currently in your network
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <NetworkSkeletonCard />
                <NetworkSkeletonCard />
                <NetworkSkeletonCard />
              </div>
            ) : connections.length > 0 ? (
              <div className="space-y-3">
                {connections.map((rel) => {
                  const currentUserId = user?.id || "";
                  const otherId =
                    rel.sourceUserId === currentUserId
                      ? rel.targetUserId
                      : rel.sourceUserId;
                  const person = otherId ? profiles[otherId] || null : null;
                  const relId = rel.id || rel.relationshipId || "";

                  return (
                    <ConnectionCard
                      key={relId || otherId}
                      relationship={rel}
                      person={person}
                      onViewProfile={handleViewProfile}
                      onRemove={openRemoveModal}
                      isBusy={busyActionId === relId}
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
                    No connections yet
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Build your professional network by discovering creators,
                    engineers, and mentors on HappenStance.
                  </p>
                  <div className="pt-2">
                    <Link href="/discover">
                      <Button variant="primary" size="md">
                        Discover Professionals
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </section>
        )}

        {/* Tab 2: Incoming Invitations */}
        {activeTab === "incoming" && (
          <section aria-labelledby="incoming-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="incoming-heading"
                  className="text-lg font-bold text-[#0F172A]"
                >
                  Invitations Received ({incoming.length})
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Professionals who requested to join your network
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <NetworkSkeletonCard />
                <NetworkSkeletonCard />
              </div>
            ) : incoming.length > 0 ? (
              <div className="space-y-3">
                {incoming.map((rel) => {
                  const senderId = rel.sourceUserId || "";
                  const person = senderId ? profiles[senderId] || null : null;
                  const relId = rel.id || rel.relationshipId || "";

                  return (
                    <InvitationCard
                      key={relId || senderId}
                      type="incoming"
                      relationship={rel}
                      person={person}
                      onViewProfile={handleViewProfile}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      isBusy={busyActionId === relId}
                    />
                  );
                })}
              </div>
            ) : (
              <Card className="py-14 px-6 text-center shadow-xs">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#F8FAFC] text-[#64748B] flex items-center justify-center border border-[#E2E8F0]">
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
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-base text-[#0F172A]">
                    No pending invitations
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    When someone invites you to connect, their request will
                    appear here for your approval.
                  </p>
                </div>
              </Card>
            )}
          </section>
        )}

        {/* Tab 3: Outgoing Invitations */}
        {activeTab === "outgoing" && (
          <section aria-labelledby="outgoing-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="outgoing-heading"
                  className="text-lg font-bold text-[#0F172A]"
                >
                  Invitations Sent ({outgoing.length})
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Connection requests awaiting responses from recipients
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <NetworkSkeletonCard />
                <NetworkSkeletonCard />
              </div>
            ) : outgoing.length > 0 ? (
              <div className="space-y-3">
                {outgoing.map((rel) => {
                  const targetId = rel.targetUserId || "";
                  const person = targetId ? profiles[targetId] || null : null;
                  const relId = rel.id || rel.relationshipId || "";

                  return (
                    <InvitationCard
                      key={relId || targetId}
                      type="outgoing"
                      relationship={rel}
                      person={person}
                      onViewProfile={handleViewProfile}
                      onWithdraw={openWithdrawModal}
                      isBusy={busyActionId === relId}
                    />
                  );
                })}
              </div>
            ) : (
              <Card className="py-14 px-6 text-center shadow-xs">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#F8FAFC] text-[#64748B] flex items-center justify-center border border-[#E2E8F0]">
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-base text-[#0F172A]">
                    No sent invitations
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    You haven’t sent any pending invitations. Browse the
                    community to find people you may know.
                  </p>
                  <div className="pt-2">
                    <Link href="/discover">
                      <Button variant="primary" size="md">
                        Find People to Connect
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </section>
        )}
      </main>

      {/* Confirmation Modal for Remove / Withdraw */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          !confirmModal.isLoading &&
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={handleConfirmAction}
        isLoading={confirmModal.isLoading}
        title={
          confirmModal.type === "remove"
            ? "Remove Connection"
            : "Withdraw Invitation"
        }
        description={
          confirmModal.type === "remove"
            ? `Are you sure you want to remove ${confirmModal.targetName} from your professional network? You will no longer be connected.`
            : `Are you sure you want to withdraw your connection request to ${confirmModal.targetName}?`
        }
        confirmText={
          confirmModal.type === "remove"
            ? "Remove Connection"
            : "Withdraw Request"
        }
        confirmVariant="danger"
        cancelText="Cancel"
      />

      {/* Reusable Profile Preview Modal */}
      <ProfilePreviewModal
        profile={previewProfile}
        loading={previewLoading}
        onClose={handleCloseProfileModal}
        connectionStatus={previewStatus()}
        isConnecting={false}
        onConnect={() => {}}
      />
    </div>
  );
}
