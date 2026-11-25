"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import type { GraphNode, GraphEdge, SkillFrequency } from "@/lib/api";

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface SkillNetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  topSkills?: SkillFrequency[];
  userSharedSkillsCount?: number;
  onSelectNode: (node: GraphNode) => void;
  onOpenProfile: (node: GraphNode) => void;
  loading?: boolean;
}

export function SkillNetworkGraph({
  nodes: initialNodes,
  edges: initialEdges,
  topSkills = [],
  userSharedSkillsCount = 0,
  onSelectNode,
  onOpenProfile,
  loading = false,
}: SkillNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 900, height: 620 });

  // Pan & Zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  // Dragging node
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const isDraggingNodeRef = useRef(false);

  // Hover & Selection state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Filters
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string | null>(null);
  const [minSharedSkills, setMinSharedSkills] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Simulation nodes state
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const simNodesRef = useRef<SimNode[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: Math.max(clientWidth, 320),
          height: Math.max(clientHeight, 500),
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Filtered nodes and edges
  const { filteredNodes, filteredEdges, connectedNodeIds } = useMemo(() => {
    let fNodes = initialNodes;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      fNodes = fNodes.filter(
        (n) =>
          n.displayName.toLowerCase().includes(q) ||
          n.headline?.toLowerCase().includes(q) ||
          n.skills.some((s) => s.toLowerCase().includes(q)) ||
          n.isSelf
      );
    }

    // Filter by skill chip
    if (selectedSkillFilter) {
      const target = selectedSkillFilter.toLowerCase();
      fNodes = fNodes.filter(
        (n) => n.skills.some((s) => s.toLowerCase() === target) || n.isSelf
      );
    }

    const nodeIds = new Set(fNodes.map((n) => n.id));

    // Filter edges
    let fEdges = initialEdges.filter(
      (e) =>
        nodeIds.has(e.source) &&
        nodeIds.has(e.target) &&
        e.weight >= minSharedSkills
    );

    if (selectedSkillFilter) {
      const target = selectedSkillFilter.toLowerCase();
      fEdges = fEdges.filter((e) =>
        e.sharedSkills.some((s) => s.toLowerCase() === target)
      );
    }

    // Nodes that have at least one active connection (or are self)
    const connected = new Set<string>();
    fEdges.forEach((e) => {
      connected.add(e.source);
      connected.add(e.target);
    });

    return {
      filteredNodes: fNodes,
      filteredEdges: fEdges,
      connectedNodeIds: connected,
    };
  }, [initialNodes, initialEdges, searchQuery, selectedSkillFilter, minSharedSkills]);

  // Initialize or update simulation nodes
  useEffect(() => {
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;

    const existingMap = new Map<string, SimNode>();
    simNodesRef.current.forEach((n) => existingMap.set(n.id, n));

    const total = filteredNodes.length;
    const newSimNodes: SimNode[] = filteredNodes.map((n, i) => {
      const existing = existingMap.get(n.id);
      const radius = n.isSelf ? 28 : 22;

      if (existing) {
        return {
          ...n,
          radius,
          x: existing.x,
          y: existing.y,
          vx: existing.vx * 0.5,
          vy: existing.vy * 0.5,
        };
      }

      if (n.isSelf) {
        return {
          ...n,
          radius,
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
        };
      }

      // Distribute other nodes in a soft orbit around center
      const angle = (i / Math.max(total - 1, 1)) * 2 * Math.PI;
      const distance = 160 + (i % 3) * 60;
      return {
        ...n,
        radius,
        x: cx + Math.cos(angle) * distance + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * distance + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      };
    });

    simNodesRef.current = newSimNodes;
    setSimNodes(newSimNodes);
  }, [filteredNodes, dimensions]);

  // Run physics simulation
  useEffect(() => {
    let iterations = 0;
    const maxIterations = 200;
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;

    const nodeIndexMap = new Map<string, number>();
    simNodesRef.current.forEach((n, idx) => nodeIndexMap.set(n.id, idx));

    const stepSimulation = () => {
      const nodes = simNodesRef.current;
      if (nodes.length === 0) return;

      const kRepulsion = 4200;
      const kLink = 0.055;
      const damping = 0.86;

      // 1. Center gravity & boundary soft bounce
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.id === draggedNodeId) continue;

        // Self node stays firmly anchored in center
        if (n.isSelf) {
          n.vx += (cx - n.x) * 0.06;
          n.vy += (cy - n.y) * 0.06;
        } else {
          n.vx += (cx - n.x) * 0.012;
          n.vy += (cy - n.y) * 0.012;
        }

        // Soft boundary forces
        const padding = 50;
        if (n.x < padding) n.vx += (padding - n.x) * 0.1;
        if (n.x > width - padding) n.vx += (width - padding - n.x) * 0.1;
        if (n.y < padding) n.vy += (padding - n.y) * 0.1;
        if (n.y > height - padding) n.vy += (height - padding - n.y) * 0.1;
      }

      // 2. Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;
          const minDist = a.radius + b.radius + 35;

          const force = (kRepulsion / (distSq + 1200)) + (dist < minDist ? (minDist - dist) * 0.15 : 0);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (a.id !== draggedNodeId) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (b.id !== draggedNodeId) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // 3. Spring / link forces along filtered edges
      for (let i = 0; i < filteredEdges.length; i++) {
        const edge = filteredEdges[i];
        const idxA = nodeIndexMap.get(edge.source);
        const idxB = nodeIndexMap.get(edge.target);
        if (idxA === undefined || idxB === undefined) continue;

        const a = nodes[idxA];
        const b = nodes[idxB];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Desired link distance: closer if sharing more skills
        const targetDist = Math.max(90, 180 - edge.weight * 20);
        const delta = dist - targetDist;
        const force = delta * kLink * (1 + edge.weight * 0.2);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (a.id !== draggedNodeId) {
          a.vx += fx;
          a.vy += fy;
        }
        if (b.id !== draggedNodeId) {
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // 4. Position update & damping
      let totalVelocity = 0;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.id !== draggedNodeId) {
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= damping;
          n.vy *= damping;
          totalVelocity += Math.abs(n.vx) + Math.abs(n.vy);
        }
      }

      setSimNodes([...nodes]);
      iterations++;

      // Continue simulation while nodes are moving or being dragged
      if (iterations < maxIterations || totalVelocity > 0.08 || isDraggingNodeRef.current) {
        animFrameRef.current = requestAnimationFrame(stepSimulation);
      }
    };

    animFrameRef.current = requestAnimationFrame(stepSimulation);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [filteredEdges, dimensions, draggedNodeId]);

  // Lookup map for fast coordinate access
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, SimNode>();
    simNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [simNodes]);

  // Current active node for detail panel
  const activeNode = useMemo(() => {
    if (selectedNodeId) {
      return initialNodes.find((n) => n.id === selectedNodeId) || null;
    }
    if (hoveredNodeId) {
      return initialNodes.find((n) => n.id === hoveredNodeId) || null;
    }
    return null;
  }, [selectedNodeId, hoveredNodeId, initialNodes]);

  // Current active edge for tooltip
  const activeEdge = useMemo(() => {
    if (!hoveredEdgeId) return null;
    return initialEdges.find((e) => e.id === hoveredEdgeId) || null;
  }, [hoveredEdgeId, initialEdges]);

  // Self node
  const selfNode = useMemo(() => {
    return initialNodes.find((n) => n.isSelf) || null;
  }, [initialNodes]);

  // Skills shared between activeNode and self
  const skillsSharedWithSelf = useMemo(() => {
    if (!activeNode || activeNode.isSelf || !selfNode) return [];
    const selfSkillSet = new Set(selfNode.skills.map((s) => s.trim().toLowerCase()));
    return activeNode.skills.filter((s) => selfSkillSet.has(s.trim().toLowerCase()));
  }, [activeNode, selfNode]);

  // Highlighted connected IDs when a node is hovered or selected
  const activeConnectedNodeIds = useMemo(() => {
    const targetId = hoveredNodeId || selectedNodeId;
    if (!targetId) return null;
    const connected = new Set<string>([targetId]);
    filteredEdges.forEach((e) => {
      if (e.source === targetId) connected.add(e.target);
      if (e.target === targetId) connected.add(e.source);
    });
    return connected;
  }, [hoveredNodeId, selectedNodeId, filteredEdges]);

  // Pan handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if left clicked and not dragging a node
    if (e.button !== 0 || isDraggingNodeRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: transform.x,
      initialY: transform.y,
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNodeRef.current && draggedNodeId && svgRef.current) {
      // Dragging a node in world space
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const worldX = (clientX - transform.x) / transform.scale;
      const worldY = (clientY - transform.y) / transform.scale;

      const node = simNodesRef.current.find((n) => n.id === draggedNodeId);
      if (node) {
        node.x = worldX;
        node.y = worldY;
        node.vx = 0;
        node.vy = 0;
        setSimNodes([...simNodesRef.current]);
      }
      return;
    }

    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setTransform((prev) => ({
        ...prev,
        x: panStartRef.current.initialX + dx,
        y: panStartRef.current.initialY + dy,
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (isDraggingNodeRef.current) {
      isDraggingNodeRef.current = false;
      setDraggedNodeId(null);
    }
  };

  // Zoom controls
  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (direction === "reset") {
      setTransform({ x: 0, y: 0, scale: 1 });
      return;
    }
    const factor = direction === "in" ? 1.25 : 0.8;
    setTransform((prev) => {
      const nextScale = Math.min(Math.max(prev.scale * factor, 0.4), 2.5);
      return { ...prev, scale: nextScale };
    });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((prev) => {
      const nextScale = Math.min(Math.max(prev.scale * factor, 0.4), 2.5);
      return { ...prev, scale: nextScale };
    });
  };

  // Center on Self
  const handleCenterSelf = () => {
    if (!selfNode) return;
    const selfPos = nodePositionMap.get(selfNode.id);
    if (!selfPos) return;
    const { width, height } = dimensions;
    const targetScale = 1.1;
    setTransform({
      scale: targetScale,
      x: width / 2 - selfPos.x * targetScale,
      y: height / 2 - selfPos.y * targetScale,
    });
  };

  // Node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    isDraggingNodeRef.current = true;
    setDraggedNodeId(nodeId);
    setSelectedNodeId(nodeId);
    const n = initialNodes.find((item) => item.id === nodeId);
    if (n) onSelectNode(n);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, nodeId?: string) => {
    if (nodeId) {
      isDraggingNodeRef.current = true;
      setDraggedNodeId(nodeId);
      setSelectedNodeId(nodeId);
      const n = initialNodes.find((item) => item.id === nodeId);
      if (n) onSelectNode(n);
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialX: transform.x,
        initialY: transform.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingNodeRef.current && draggedNodeId && svgRef.current && e.touches.length === 1) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.touches[0].clientX - rect.left;
      const clientY = e.touches[0].clientY - rect.top;
      const worldX = (clientX - transform.x) / transform.scale;
      const worldY = (clientY - transform.y) / transform.scale;

      const node = simNodesRef.current.find((n) => n.id === draggedNodeId);
      if (node) {
        node.x = worldX;
        node.y = worldY;
        node.vx = 0;
        node.vy = 0;
        setSimNodes([...simNodesRef.current]);
      }
    } else if (isPanning && e.touches.length === 1) {
      const dx = e.touches[0].clientX - panStartRef.current.x;
      const dy = e.touches[0].clientY - panStartRef.current.y;
      setTransform((prev) => ({
        ...prev,
        x: panStartRef.current.initialX + dx,
        y: panStartRef.current.initialY + dy,
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    isDraggingNodeRef.current = false;
    setDraggedNodeId(null);
  };

  return (
    <div className="relative w-full rounded-2xl border border-[#CBD5E1] bg-slate-900 overflow-hidden shadow-xl select-none">
      {/* Top Controls Toolbar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        {/* Search & Skill Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              placeholder="Search member or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 text-xs bg-slate-800/90 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Skill Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full no-scrollbar">
            <button
              onClick={() => setSelectedSkillFilter(null)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${
                selectedSkillFilter === null
                  ? "bg-[#0A66C2] text-white shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              All Skills
            </button>
            {topSkills.slice(0, 6).map((item) => {
              const active = selectedSkillFilter?.toLowerCase() === item.skill.toLowerCase();
              return (
                <button
                  key={item.skill}
                  onClick={() =>
                    setSelectedSkillFilter(active ? null : item.skill)
                  }
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span>{item.skill}</span>
                  <span className="text-[10px] opacity-75">({item.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center gap-2">
          {/* Min Shared Filter */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="text-[11px] text-slate-400">Min Shared:</span>
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setMinSharedSkills(num)}
                className={`w-5 h-5 rounded text-[11px] font-bold transition-all ${
                  minSharedSkills === num
                    ? "bg-[#0A66C2] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {num}+
              </button>
            ))}
          </div>

          {/* Focus Self */}
          {selfNode && (
            <button
              onClick={handleCenterSelf}
              title="Center on Your Node"
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>🎯 Focus You</span>
            </button>
          )}

          {/* Zoom buttons */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xs">
            <button
              onClick={() => handleZoom("in")}
              title="Zoom In"
              className="px-2.5 py-1 text-slate-300 hover:bg-slate-700 font-bold text-sm border-r border-slate-700"
            >
              +
            </button>
            <button
              onClick={() => handleZoom("out")}
              title="Zoom Out"
              className="px-2.5 py-1 text-slate-300 hover:bg-slate-700 font-bold text-sm border-r border-slate-700"
            >
              −
            </button>
            <button
              onClick={() => handleZoom("reset")}
              title="Reset View"
              className="px-2 py-1 text-slate-400 hover:bg-slate-700 text-xs"
            >
              1:1
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Interactive Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onTouchStart={(e) => handleTouchStart(e)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`relative w-full h-[520px] sm:h-[620px] cursor-${
          isPanning ? "grabbing" : "grab"
        } bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden`}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-200">
              Generating Real-Time Skill Graph...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Calculating shared skills & connection weights from MongoDB
            </p>
          </div>
        )}

        {/* Empty state overlay */}
        {!loading && filteredNodes.length === 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl mb-3">
              🕸️
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No matching skill connections
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              We couldn't find members matching this filter. Try clearing your search query or selecting &quot;All Skills&quot;.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedSkillFilter(null);
                setMinSharedSkills(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full"
        >
          {/* Defs for gradients & glowing filters */}
          <defs>
            <radialGradient id="selfGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0A66C2" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="edgeGradHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* World Container with transform */}
          <g
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          >
            {/* Edges Layer */}
            <g className="edges-layer">
              {filteredEdges.map((edge) => {
                const nodeA = nodePositionMap.get(edge.source);
                const nodeB = nodePositionMap.get(edge.target);
                if (!nodeA || !nodeB) return null;

                const isEdgeHovered = hoveredEdgeId === edge.id;
                const isEdgeConnectedToActive =
                  (hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) ||
                  (selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId));

                // Style based on weight
                let strokeWidth = 1.5;
                let strokeColor = "#475569";
                let strokeOpacity = 0.4;

                if (edge.weight === 2) {
                  strokeWidth = 2.5;
                  strokeColor = "#60A5FA";
                  strokeOpacity = 0.65;
                } else if (edge.weight >= 3) {
                  strokeWidth = 3.8;
                  strokeColor = "#3B82F6";
                  strokeOpacity = 0.85;
                }

                if (isEdgeConnectedToActive || isEdgeHovered) {
                  strokeWidth += 2;
                  strokeColor = "#F59E0B";
                  strokeOpacity = 1.0;
                } else if (activeConnectedNodeIds && !isEdgeConnectedToActive) {
                  strokeOpacity = 0.12;
                }

                return (
                  <g key={edge.id}>
                    {/* Invisible wider hit area for easy hover on mobile/desktop */}
                    <line
                      x1={nodeA.x}
                      y1={nodeA.y}
                      x2={nodeB.x}
                      y2={nodeB.y}
                      stroke="transparent"
                      strokeWidth={Math.max(strokeWidth * 3, 16)}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}
                      onClick={() => setHoveredEdgeId(edge.id)}
                    />
                    {/* Rendered Edge Line */}
                    <line
                      x1={nodeA.x}
                      y1={nodeA.y}
                      x2={nodeB.x}
                      y2={nodeB.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeLinecap="round"
                      filter={isEdgeHovered || isEdgeConnectedToActive ? "url(#glowEffect)" : undefined}
                      className="transition-all duration-150 pointer-events-none"
                    />
                    {/* Midpoint pill for high synergy edges */}
                    {edge.weight >= 2 && !activeConnectedNodeIds && (
                      <g
                        transform={`translate(${(nodeA.x + nodeB.x) / 2}, ${(nodeA.y + nodeB.y) / 2})`}
                        className="pointer-events-none"
                      >
                        <circle r="7" fill="#0F172A" stroke={strokeColor} strokeWidth="1.5" />
                        <text
                          y="2.5"
                          textAnchor="middle"
                          fill="#93C5FD"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {edge.weight}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Nodes Layer */}
            <g className="nodes-layer">
              {simNodes.map((node) => {
                const isNodeHovered = hoveredNodeId === node.id;
                const isNodeSelected = selectedNodeId === node.id;
                const isDragging = draggedNodeId === node.id;

                const isConnectedToActive =
                  activeConnectedNodeIds === null || activeConnectedNodeIds.has(node.id);

                const opacity = isConnectedToActive ? 1.0 : 0.22;
                const initial = (node.displayName || "M").slice(0, 1).toUpperCase();

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    opacity={opacity}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onTouchStart={(e) => handleTouchStart(e, node.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      onSelectNode(node);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onOpenProfile(node);
                    }}
                    className={`cursor-pointer transition-opacity duration-200 ${
                      isDragging ? "scale-105" : ""
                    }`}
                  >
                    {/* Pulsing glow ring for Self Node */}
                    {node.isSelf && (
                      <>
                        <circle
                          r={node.radius + 10}
                          fill="url(#selfGlow)"
                          className="animate-pulse"
                        />
                        <circle
                          r={node.radius + 5}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                      </>
                    )}

                    {/* Ring for Selected / Hovered Node */}
                    {(isNodeHovered || isNodeSelected) && !node.isSelf && (
                      <circle
                        r={node.radius + 6}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2.5"
                        filter="url(#glowEffect)"
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r={node.radius}
                      fill={node.isSelf ? "#0A66C2" : "#1E293B"}
                      stroke={
                        node.isSelf
                          ? "#F59E0B"
                          : isNodeSelected
                          ? "#38BDF8"
                          : "#475569"
                      }
                      strokeWidth={node.isSelf ? 3 : 2}
                      className="shadow-lg"
                    />

                    {/* Node Initial / Avatar */}
                    <text
                      y={node.isSelf ? "4" : "4"}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={node.isSelf ? "14" : "11"}
                      fontWeight="bold"
                      className="pointer-events-none select-none font-sans"
                    >
                      {initial}
                    </text>

                    {/* Self Badge Label */}
                    {node.isSelf && (
                      <g transform={`translate(0, ${node.radius + 14})`}>
                        <rect
                          x="-18"
                          y="-9"
                          width="36"
                          height="16"
                          rx="8"
                          fill="#F59E0B"
                        />
                        <text
                          y="2.5"
                          textAnchor="middle"
                          fill="#0F172A"
                          fontSize="9"
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          YOU
                        </text>
                      </g>
                    )}

                    {/* Member Name Label Below Node */}
                    <text
                      y={node.radius + (node.isSelf ? 28 : 16)}
                      textAnchor="middle"
                      fill={isNodeHovered || isNodeSelected || node.isSelf ? "#FFFFFF" : "#CBD5E1"}
                      fontSize={node.isSelf ? "12" : "11"}
                      fontWeight={node.isSelf || isNodeSelected ? "bold" : "600"}
                      className="pointer-events-none select-none"
                      style={{
                        paintOrder: "stroke",
                        stroke: "#0F172A",
                        strokeWidth: "3px",
                        strokeLinejoin: "round",
                      }}
                    >
                      {node.displayName.length > 16
                        ? `${node.displayName.slice(0, 14)}…`
                        : node.displayName}
                    </text>

                    {/* Skills count sub-pill */}
                    {!node.isSelf && node.skills.length > 0 && (
                      <text
                        y={node.radius + 28}
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize="9"
                        className="pointer-events-none select-none"
                      >
                        {node.skills.length} skills
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Floating Edge Tooltip */}
        {activeEdge && (
          <div className="absolute top-4 left-4 z-30 max-w-sm bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-xl p-3 shadow-2xl text-white pointer-events-none animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
              <span>⚡ Skill Connection Synergy</span>
              <span className="ml-auto px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                {activeEdge.weight} {activeEdge.weight === 1 ? "Skill" : "Skills"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-2">
              <span className="font-semibold text-white">
                {nodePositionMap.get(activeEdge.source)?.displayName || "Member"}
              </span>{" "}
              &{" "}
              <span className="font-semibold text-white">
                {nodePositionMap.get(activeEdge.target)?.displayName || "Member"}
              </span>
            </p>
            <div className="flex flex-wrap gap-1">
              {activeEdge.sharedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-blue-900/60 border border-blue-500/40 text-blue-200 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Floating Quick Legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 sm:p-3 text-[11px] text-slate-300 shadow-lg space-y-1.5 max-w-[210px] sm:max-w-none">
          <div className="font-bold text-slate-200 text-xs mb-1 flex items-center justify-between">
            <span>Network Key</span>
            <span className="text-[10px] text-slate-400 font-normal">Real MongoDB Data</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0A66C2] ring-2 ring-amber-400 flex-shrink-0" />
              <span>You (Central Node)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#1E293B] border border-slate-600 flex-shrink-0" />
              <span>Network Member</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-slate-500 rounded flex-shrink-0" />
              <span>1 Shared Skill</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-1 bg-blue-500 rounded flex-shrink-0" />
              <span>2+ Shared Skills</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            • Drag nodes to reposition • Scroll to zoom • Click node for details
          </p>
        </div>

        {/* Selected Node Details Drawer */}
        {activeNode && (
          <div className="absolute top-3 right-3 z-30 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-slideIn">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative">
              <button
                onClick={() => {
                  setSelectedNodeId(null);
                  setHoveredNodeId(null);
                }}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-700/80 hover:bg-slate-600 text-slate-300 text-xs flex items-center justify-center transition-colors"
              >
                ✕
              </button>

              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                    activeNode.isSelf ? "bg-[#0A66C2] ring-2 ring-amber-400" : "bg-slate-700"
                  }`}
                >
                  {(activeNode.displayName || "M").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-white truncate">
                      {activeNode.displayName}
                    </h4>
                    {activeNode.isSelf && (
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-extrabold text-[9px] rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    {activeNode.headline || "HappenStance Member"}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-3.5 max-h-[340px] overflow-y-auto text-xs">
              {/* Location & Industry */}
              {(activeNode.location || activeNode.industry) && (
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span>📍</span>
                  <span>
                    {[activeNode.location, activeNode.industry].filter(Boolean).join(" · ")}
                  </span>
                </div>
              )}

              {/* Skills Shared with YOU */}
              {!activeNode.isSelf && skillsSharedWithSelf.length > 0 && (
                <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#0A66C2] mb-1.5">
                    <span>⚡ Shared With You ({skillsSharedWithSelf.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {skillsSharedWithSelf.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-[#0A66C2] text-white text-[10px] font-semibold rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* All Skills */}
              <div>
                <span className="font-bold text-slate-700 block mb-1.5 text-[11px]">
                  All Listed Skills ({activeNode.skills.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeNode.skills.map((skill) => {
                    const isShared = skillsSharedWithSelf.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isShared
                            ? "bg-blue-100 text-[#0A66C2] font-semibold border border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                {activeNode.isSelf ? (
                  <Link href="/profile" className="w-full">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      Edit Your Profile
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenProfile(activeNode)}
                    className="w-full text-xs"
                  >
                    View Full Profile & Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-white">{filteredNodes.length}</strong> Visible Members
          </span>
          <span>•</span>
          <span>
            <strong className="text-white">{filteredEdges.length}</strong> Skill Connections
          </span>
          {selfNode && (
            <>
              <span>•</span>
              <span className="text-amber-400">
                <strong className="text-amber-300">{userSharedSkillsCount}</strong> Your Shared Synergies
              </span>
            </>
          )}
        </div>
        <div className="text-slate-500">
          Double-click any node to open their full profile preview
        </div>
      </div>
    </div>
  );
}

export default SkillNetworkGraph;
