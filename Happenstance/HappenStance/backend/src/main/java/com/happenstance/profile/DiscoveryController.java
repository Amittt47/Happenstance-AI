
package com.happenstance.profile;

import com.happenstance.user.UserAccount;
import com.happenstance.user.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/discovery")
public class DiscoveryController {

    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;

    public DiscoveryController(
            MongoTemplate mongoTemplate,
            UserRepository userRepository) {
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
    }

    @GetMapping("/profiles")
    public Page<DiscoveryProfileResponse> discoverProfiles(
            Authentication auth,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        validateAuthentication(auth);

        if (page < 0 || size < 1 || size > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid pagination parameters"
            );
        }

        List<Criteria> filters = new ArrayList<>();

        filters.add(Criteria.where("visibility").is("PUBLIC"));
        filters.add(Criteria.where("userId").ne(auth.getName()));

        if (hasText(keyword)) {
            String pattern = regex(keyword.trim());

            // Also search by user display name
            Query userQuery = new Query(
                    Criteria.where("displayName").regex(pattern, "i")
            );
            List<UserAccount> matchingUsers =
                    mongoTemplate.find(userQuery, UserAccount.class);
            List<String> userIds = matchingUsers.stream()
                    .map(UserAccount::getId)
                    .toList();

            List<Criteria> orConditions = new ArrayList<>();
            orConditions.add(Criteria.where("headline").regex(pattern, "i"));
            orConditions.add(Criteria.where("bio").regex(pattern, "i"));
            orConditions.add(Criteria.where("industry").regex(pattern, "i"));
            orConditions.add(Criteria.where("location").regex(pattern, "i"));
            orConditions.add(Criteria.where("skills").regex(pattern, "i"));
            orConditions.add(Criteria.where("interests").regex(pattern, "i"));

            if (!userIds.isEmpty()) {
                orConditions.add(Criteria.where("userId").in(userIds));
            }

            filters.add(new Criteria().orOperator(
                    orConditions.toArray(new Criteria[0])
            ));
        }

        if (hasText(skill)) {
            filters.add(
                    Criteria.where("skills")
                            .regex(regex(skill.trim()), "i")
            );
        }

        if (hasText(industry)) {
            filters.add(
                    Criteria.where("industry")
                            .regex(regex(industry.trim()), "i")
            );
        }

        if (hasText(location)) {
            filters.add(
                    Criteria.where("location")
                            .regex(regex(location.trim()), "i")
            );
        }

        Query query = new Query(
                new Criteria().andOperator(
                        filters.toArray(new Criteria[0])
                )
        );

        long total = mongoTemplate.count(query, Profile.class);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "updatedAt")
        );

        query.with(pageable);

        List<Profile> profiles =
                mongoTemplate.find(query, Profile.class);

        List<DiscoveryProfileResponse> responses =
                enrichProfiles(profiles);

        return new PageImpl<>(responses, pageable, total);
    }

    @GetMapping("/profiles/{userId}")
    public DiscoveryProfileResponse getPublicProfile(
            @PathVariable String userId,
            Authentication auth) {

        validateAuthentication(auth);

        Query query = new Query(
                Criteria.where("userId").is(userId)
                        .and("visibility").is("PUBLIC")
        );

        Profile profile = mongoTemplate.findOne(query, Profile.class);

        if (profile == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Public profile not found"
            );
        }

        return enrichProfile(profile);
    }

    @GetMapping("/skill-graph")
    public SkillGraphResponse getSkillGraph(
            Authentication auth,
            @RequestParam(defaultValue = "40") int limit,
            @RequestParam(required = false) String skill) {

        validateAuthentication(auth);
        String currentUserId = auth.getName();

        // 1. Fetch current user's profile
        Query selfQuery = new Query(Criteria.where("userId").is(currentUserId));
        Profile selfProfile = mongoTemplate.findOne(selfQuery, Profile.class);

        // 2. Fetch other public profiles
        List<Criteria> otherCriteria = new ArrayList<>();
        otherCriteria.add(Criteria.where("visibility").is("PUBLIC"));
        otherCriteria.add(Criteria.where("userId").ne(currentUserId));
        if (hasText(skill)) {
            otherCriteria.add(Criteria.where("skills").regex(regex(skill.trim()), "i"));
        }

        Query publicQuery = new Query(new Criteria().andOperator(otherCriteria.toArray(new Criteria[0])));
        publicQuery.limit(Math.min(limit, 100));
        publicQuery.with(Sort.by(Sort.Direction.DESC, "updatedAt"));
        List<Profile> publicProfiles = mongoTemplate.find(publicQuery, Profile.class);

        // Deduplicate profiles by userId
        Map<String, Profile> profileMap = new LinkedHashMap<>();
        if (selfProfile != null) {
            profileMap.put(currentUserId, selfProfile);
        } else {
            Profile fallback = new Profile();
            fallback.setUserId(currentUserId);
            fallback.setSkills(List.of());
            profileMap.put(currentUserId, fallback);
        }
        for (Profile p : publicProfiles) {
            if (p.getUserId() != null && !profileMap.containsKey(p.getUserId())) {
                profileMap.put(p.getUserId(), p);
            }
        }

        // Fetch user accounts for display names
        List<String> allUserIds = new ArrayList<>(profileMap.keySet());
        Map<String, UserAccount> userAccounts = userRepository.findAllById(allUserIds)
                .stream()
                .collect(Collectors.toMap(UserAccount::getId, Function.identity(), (a, b) -> a));

        // Build Graph Nodes
        List<SkillGraphResponse.GraphNode> nodes = new ArrayList<>();
        for (Profile p : profileMap.values()) {
            String uid = p.getUserId();
            UserAccount u = userAccounts.get(uid);
            String name = u != null && u.getDisplayName() != null ? u.getDisplayName() : "Member";
            boolean isSelf = currentUserId.equals(uid);
            List<String> skills = p.getSkills() != null ? p.getSkills() : List.of();

            nodes.add(new SkillGraphResponse.GraphNode(
                    uid,
                    name,
                    p.getHeadline(),
                    p.getLocation(),
                    p.getIndustry(),
                    skills,
                    isSelf
            ));
        }

        // Build Graph Edges based on shared skills
        List<SkillGraphResponse.GraphEdge> edges = new ArrayList<>();
        Map<String, Long> skillCounter = new HashMap<>();
        int userSharedCount = 0;

        for (int i = 0; i < nodes.size(); i++) {
            SkillGraphResponse.GraphNode nodeA = nodes.get(i);
            List<String> skillsA = nodeA.skills();
            Map<String, String> normalizedA = new HashMap<>();
            for (String s : skillsA) {
                if (hasText(s)) {
                    normalizedA.put(s.trim().toLowerCase(), s.trim());
                    skillCounter.put(s.trim(), skillCounter.getOrDefault(s.trim(), 0L) + 1L);
                }
            }

            for (int j = i + 1; j < nodes.size(); j++) {
                SkillGraphResponse.GraphNode nodeB = nodes.get(j);
                List<String> skillsB = nodeB.skills();

                List<String> shared = new ArrayList<>();
                for (String s : skillsB) {
                    if (hasText(s)) {
                        String lower = s.trim().toLowerCase();
                        if (normalizedA.containsKey(lower)) {
                            shared.add(normalizedA.get(lower));
                        }
                    }
                }

                if (!shared.isEmpty()) {
                    int weight = shared.size();
                    String edgeId = "edge_" + nodeA.id() + "_" + nodeB.id();
                    edges.add(new SkillGraphResponse.GraphEdge(
                            edgeId,
                            nodeA.id(),
                            nodeB.id(),
                            shared,
                            weight
                    ));

                    if (nodeA.isSelf() || nodeB.isSelf()) {
                        userSharedCount += weight;
                    }
                }
            }
        }

        // Top skills in the graph
        List<SkillGraphResponse.SkillFrequency> topSkills = skillCounter.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .limit(10)
                .map(e -> new SkillGraphResponse.SkillFrequency(e.getKey(), e.getValue()))
                .toList();

        return new SkillGraphResponse(nodes, edges, topSkills, userSharedCount);
    }

    private List<DiscoveryProfileResponse> enrichProfiles(
            List<Profile> profiles) {

        if (profiles == null || profiles.isEmpty()) {
            return List.of();
        }

        List<String> userIds = profiles.stream()
                .map(profile -> profile.getUserId())
                .filter(this::hasText)
                .distinct()
                .toList();

        Map<String, UserAccount> users =
                userRepository.findAllById(userIds)
                        .stream()
                        .collect(Collectors.toMap(
                                user -> user.getId(),
                                Function.identity()
                        ));

        return profiles.stream()
                .map(profile -> {
                    UserAccount user = users.get(profile.getUserId());

                    String displayName = user == null
                            ? null
                            : user.getDisplayName();

                    return DiscoveryProfileResponse.from(
                            profile,
                            displayName
                    );
                })
                .toList();
    }

    private DiscoveryProfileResponse enrichProfile(Profile profile) {

        UserAccount user = userRepository.findById(profile.getUserId())
                .orElse(null);

        String displayName = user == null
                ? null
                : user.getDisplayName();

        return DiscoveryProfileResponse.from(
                profile,
                displayName
        );
    }

    private void validateAuthentication(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String regex(String value) {
        return Pattern.quote(value);
    }
}
