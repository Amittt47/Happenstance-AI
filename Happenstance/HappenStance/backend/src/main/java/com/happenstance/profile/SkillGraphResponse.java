package com.happenstance.profile;

import java.util.List;

public class SkillGraphResponse {

    public record GraphNode(
            String id,
            String displayName,
            String headline,
            String location,
            String industry,
            List<String> skills,
            boolean isSelf
    ) {}

    public record GraphEdge(
            String id,
            String source,
            String target,
            List<String> sharedSkills,
            int weight
    ) {}

    public record SkillFrequency(
            String skill,
            long count
    ) {}

    private List<GraphNode> nodes;
    private List<GraphEdge> edges;
    private int totalNodes;
    private int totalEdges;
    private List<SkillFrequency> topSkills;
    private int userSharedSkillsCount;

    public SkillGraphResponse() {}

    public SkillGraphResponse(
            List<GraphNode> nodes,
            List<GraphEdge> edges,
            List<SkillFrequency> topSkills,
            int userSharedSkillsCount) {
        this.nodes = nodes;
        this.edges = edges;
        this.totalNodes = nodes != null ? nodes.size() : 0;
        this.totalEdges = edges != null ? edges.size() : 0;
        this.topSkills = topSkills;
        this.userSharedSkillsCount = userSharedSkillsCount;
    }

    public List<GraphNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<GraphNode> nodes) {
        this.nodes = nodes;
        this.totalNodes = nodes != null ? nodes.size() : 0;
    }

    public List<GraphEdge> getEdges() {
        return edges;
    }

    public void setEdges(List<GraphEdge> edges) {
        this.edges = edges;
        this.totalEdges = edges != null ? edges.size() : 0;
    }

    public int getTotalNodes() {
        return totalNodes;
    }

    public void setTotalNodes(int totalNodes) {
        this.totalNodes = totalNodes;
    }

    public int getTotalEdges() {
        return totalEdges;
    }

    public void setTotalEdges(int totalEdges) {
        this.totalEdges = totalEdges;
    }

    public List<SkillFrequency> getTopSkills() {
        return topSkills;
    }

    public void setTopSkills(List<SkillFrequency> topSkills) {
        this.topSkills = topSkills;
    }

    public int getUserSharedSkillsCount() {
        return userSharedSkillsCount;
    }

    public void setUserSharedSkillsCount(int userSharedSkillsCount) {
        this.userSharedSkillsCount = userSharedSkillsCount;
    }
}
