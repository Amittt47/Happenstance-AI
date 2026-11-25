"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { useToast } from "@/components/common/Toast";
import { SkillNetworkGraph } from "@/components/graph/SkillNetworkGraph";
import { ProfilePreviewModal } from "@/components/discover/ProfilePreviewModal";
import type { MemberConnectionStatus } from "@/components/discover/MemberCard";
import {
  getStoredUser,
  getToken,
  clearSession,
  asArray,
  api,
  type AuthUser,
  type Profile,
  type SkillGraphResponse,
  type GraphNode,
} from "@/lib/api";

export default function NetworkGraphPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [graphData, setGraphData] = useState<SkillGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Relationship statuses
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [incomingIds, setIncomingIds] = useState<Set<string>>(new Set());
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());

  // Modal preview
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Counts for Navbar
  const [incomingCount, setIncomingCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);

  const loadGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, cRes, inRes, outRes] = await Promise.allSettled([
        api.skillGraph({ limit: 50 }),
        api.connections(),
        api.incomingRequests(),
        api.outgoingRequests(),
      ]);

      if (gRes.status === "fulfilled") {
        setGraphData(gRes.value);
      } else {
        const msg =
          gRes.reason instanceof Error
            ? gRes.reason.message
            : "Failed to load network graph data from backend.";
        setError(msg);
        toast(msg, "error");
      }

      // Track relationships
      const conns = cRes.status === "fulfilled" ? asArray(cRes.value) : [];
      const incomings = inRes.status === "fulfilled" ? asArray(inRes.value) : [];
      const outgoings = outRes.status === "fulfilled" ? asArray(outRes.value) : [];

      setIncomingCount(incomings.length);
      setConnectionsCount(conns.length);

      const connSet = new Set<string>();
      conns.forEach((r) => {
        if (r.sourceUserId) connSet.add(r.sourceUserId);
        if (r.targetUserId) connSet.add(r.targetUserId);
      });
      setConnectedIds(connSet);

      const pendSet = new Set<string>();
      outgoings.forEach((r) => {
        if (r.targetUserId) pendSet.add(r.targetUserId);
      });
      setPendingIds(pendSet);

      const inSet = new Set<string>();
      incomings.forEach((r) => {
        if (r.sourceUserId) inSet.add(r.sourceUserId);
      });
      setIncomingIds(inSet);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error initializing graph.";
      setError(msg);
      toast(msg, "error");
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
    void loadGraphData();
  }, [router, loadGraphData]);

  const handleOpenProfile = async (node: GraphNode) => {
    if (node.isSelf) {
      router.push("/profile");
      return;
    }

    setPreviewLoading(true);
    setSelectedProfile(null);

    try {
      const profile = await api.publicProfile(node.id);
      setSelectedProfile(profile);
    } catch {
      // Fallback: create preview from graph node data if direct profile fails
      setSelectedProfile({
        userId: node.id,
        displayName: node.displayName,
        headline: node.headline,
        location: node.location,
        industry: node.industry,
        skills: node.skills,
        visibility: "PUBLIC",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConnect = async (targetUserId: string, name?: string) => {
    if (
      connectingIds.has(targetUserId) ||
      pendingIds.has(targetUserId) ||
      connectedIds.has(targetUserId)
    ) {
      return;
    }

    setConnectingIds((prev) => new Set(prev).add(targetUserId));

    try {
      await api.sendConnection(targetUserId);
      setPendingIds((prev) => new Set(prev).add(targetUserId));
      toast(`Connection invitation sent to ${name || "member"}!`, "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to send connection request.",
        "error"
      );
    } finally {
      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
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
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar
        user={user}
        activeTab="graph"
        onLogout={handleLogout}
        incomingCount={incomingCount}
        connectionsCount={connectionsCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section & Network Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A66C2] rounded-2xl text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold text-amber-300 border border-white/10 shadow-2xs">
                ⚡ Happenstance AI Network Visualization
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                Live MongoDB Graph
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Skill-Based Network Graph
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Explore how professionals across HappenStance are interconnected through real shared skills. Thick lines indicate multi-skill synergy, while your profile is highlighted at the center of your network.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-white">
                {graphData?.totalNodes ?? 0}
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Network Nodes
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-blue-300">
                {graphData?.totalEdges ?? 0}
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Skill Links
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-amber-300">
                {graphData?.userSharedSkillsCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Your Synergies
              </span>
            </div>
          </div>

          {/* Background decorative glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <p><strong>Failed to load network graph:</strong> {error}</p>
            <Button variant="secondary" size="sm" onClick={() => void loadGraphData()}>
              Retry
            </Button>
          </div>
        )}

        {/* Interactive Graph Canvas Component */}
        <SkillNetworkGraph
          nodes={graphData?.nodes ?? []}
          edges={graphData?.edges ?? []}
          topSkills={graphData?.topSkills ?? []}
          userSharedSkillsCount={graphData?.userSharedSkillsCount ?? 0}
          onSelectNode={(node) => {
            // Optional callback when node is clicked
          }}
          onOpenProfile={(node) => void handleOpenProfile(node)}
          loading={loading}
        />

        {/* Informational Cards & How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#0A66C2] font-bold text-sm">
              <span className="text-base">🧠</span>
              <h3>Skill-Centric Discovery</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Unlike traditional flat directory lists, the Skill Graph maps clusters of professionals with overlapping technical and domain expertise, revealing natural collaborators and mentors.
            </p>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#0A66C2] font-bold text-sm">
              <span className="text-base">🔗</span>
              <h3>Dynamic Connection Weights</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Edges scale from thin single-skill links to bold high-synergy bonds when members share 2, 3, or more verified skills. Hover over any edge line to inspect specific shared technologies.
            </p>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#0A66C2] font-bold text-sm">
              <span className="text-base">🛡️</span>
              <h3>Privacy-Aware Graph</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Every node respects user visibility preferences. Only public network profiles and your permitted connections are surfaced in the graph, with live data directly queryable from MongoDB.
            </p>
          </Card>
        </div>
      </main>

      {/* Profile Preview Modal (Reusing existing component) */}
      <ProfilePreviewModal
        profile={selectedProfile}
        loading={previewLoading}
        onClose={() => setSelectedProfile(null)}
        connectionStatus={
          selectedProfile?.userId
            ? getMemberStatus(selectedProfile.userId)
            : "NONE"
        }
        isConnecting={
          selectedProfile?.userId
            ? connectingIds.has(selectedProfile.userId)
            : false
        }
        onConnect={(targetUserId, name) => void handleConnect(targetUserId, name)}
      />
    </div>
  );
}
