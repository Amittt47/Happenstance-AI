
package com.happenstance.relationship;

import com.happenstance.profile.Profile;
import com.happenstance.profile.ProfileRepository;
import com.happenstance.user.UserAccount;
import com.happenstance.user.UserRepository;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/relationships")
public class RelationshipController {

    private static final String PENDING = "PENDING";
    private static final String ACCEPTED = "ACCEPTED";
    private static final String REJECTED = "REJECTED";

    private final RelationshipRepository relationships;
    private final UserRepository users;
    private final ProfileRepository profiles;

    public RelationshipController(
            RelationshipRepository relationships,
            UserRepository users,
            ProfileRepository profiles) {

        this.relationships = relationships;
        this.users = users;
        this.profiles = profiles;
    }

    // Send a connection request.
    @PostMapping("/{targetUserId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Relationship requestConnection(
            Authentication auth,
            @PathVariable String targetUserId) {

        String sourceUserId = authenticatedUserId(auth);

        if (targetUserId == null || targetUserId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target user ID is required."
            );
        }

        if (sourceUserId.equals(targetUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot connect with yourself."
            );
        }

        users.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found."
                ));

        Relationship existing = relationships
                .findBySourceUserIdAndTargetUserId(
                        sourceUserId,
                        targetUserId
                ).orElse(null);

        Relationship reverse = relationships
                .findBySourceUserIdAndTargetUserId(
                        targetUserId,
                        sourceUserId
                ).orElse(null);

        if (isActive(existing) || isActive(reverse)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A pending or accepted relationship already exists."
            );
        }

        Relationship relationship;

        if (existing != null) {
            relationship = existing;
        } else if (reverse != null) {
            relationship = reverse;
            relationship.setSourceUserId(sourceUserId);
            relationship.setTargetUserId(targetUserId);
        } else {
            relationship = new Relationship();
            relationship.setSourceUserId(sourceUserId);
            relationship.setTargetUserId(targetUserId);
        }

        relationship.setType("CONNECTION");
        relationship.setStatus(PENDING);
        relationship.setVisibility("PRIVATE");
        relationship.setProvenance("USER_DECLARED");
        relationship.setCreatedAt(Instant.now());

        try {
            return relationships.save(relationship);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A relationship request already exists."
            );
        }
    }

    // View incoming connection requests.
    @GetMapping("/requests/incoming")
    public List<Relationship> incomingRequests(Authentication auth) {

        return relationships.findByTargetUserIdAndStatus(
                authenticatedUserId(auth),
                PENDING
        );
    }

    // View outgoing connection requests.
    @GetMapping("/requests/outgoing")
    public List<Relationship> outgoingRequests(Authentication auth) {

        return relationships.findBySourceUserIdAndStatus(
                authenticatedUserId(auth),
                PENDING
        );
    }

    // Accept a connection request.
    @PatchMapping("/{relationshipId}/accept")
    public Relationship acceptRequest(
            Authentication auth,
            @PathVariable String relationshipId) {

        String userId = authenticatedUserId(auth);
        Relationship relationship = getRelationship(relationshipId);

        requireRecipient(relationship, userId);
        requirePending(relationship);

        relationship.setStatus(ACCEPTED);
        relationship.setVisibility("CONNECTIONS");

        return relationships.save(relationship);
    }

    // Reject a connection request.
    @PatchMapping("/{relationshipId}/reject")
    public Relationship rejectRequest(
            Authentication auth,
            @PathVariable String relationshipId) {

        String userId = authenticatedUserId(auth);
        Relationship relationship = getRelationship(relationshipId);

        requireRecipient(relationship, userId);
        requirePending(relationship);

        relationship.setStatus(REJECTED);
        relationship.setVisibility("PRIVATE");

        return relationships.save(relationship);
    }

    // View all accepted connections.
    @GetMapping
    public List<Relationship> myConnections(Authentication auth) {

        String userId = authenticatedUserId(auth);

        List<Relationship> sent =
                relationships.findBySourceUserIdAndStatus(
                        userId,
                        ACCEPTED
                );

        List<Relationship> received =
                relationships.findByTargetUserIdAndStatus(
                        userId,
                        ACCEPTED
                );

        // Do not modify lists returned by the repository.
        List<Relationship> connections = new ArrayList<>(sent);
        connections.addAll(received);

        return connections;
    }

    public record MutualConnectionMember(
            String userId,
            String displayName,
            String headline
    ) {}

    public record MutualConnectionsResponse(
            int count,
            List<MutualConnectionMember> mutualConnections
    ) {}

    // View mutual connections between authenticated user and target user
    @GetMapping("/mutual/{targetUserId}")
    public MutualConnectionsResponse getMutualConnections(
            Authentication auth,
            @PathVariable String targetUserId) {

        String currentUserId = authenticatedUserId(auth);

        if (targetUserId == null || targetUserId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target user ID is required."
            );
        }

        String targetId = targetUserId.trim();

        // Self-profile preview has zero mutual connections
        if (currentUserId.equals(targetId)) {
            return new MutualConnectionsResponse(0, List.of());
        }

        // Validate target user exists
        users.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Target user not found."
                ));

        Set<String> myConnections = getAcceptedConnectionUserIds(currentUserId);
        Set<String> targetConnections = getAcceptedConnectionUserIds(targetId);

        Set<String> mutualUserIds = new HashSet<>(myConnections);
        mutualUserIds.retainAll(targetConnections);
        mutualUserIds.remove(currentUserId);
        mutualUserIds.remove(targetId);

        if (mutualUserIds.isEmpty()) {
            return new MutualConnectionsResponse(0, List.of());
        }

        Map<String, UserAccount> userMap = users.findAllById(mutualUserIds).stream()
                .collect(Collectors.toMap(
                        UserAccount::getId,
                        Function.identity(),
                        (first, second) -> first
                ));

        Map<String, Profile> profileMap = profiles.findByUserIdIn(mutualUserIds).stream()
                .filter(Objects::nonNull)
                .filter(p -> p.getUserId() != null)
                .collect(Collectors.toMap(
                        Profile::getUserId,
                        Function.identity(),
                        (first, second) -> first
                ));

        List<MutualConnectionMember> members = mutualUserIds.stream()
                .map(userId -> {
                    UserAccount account = userMap.get(userId);
                    Profile profile = profileMap.get(userId);

                    String displayName = account != null && account.getDisplayName() != null
                            ? account.getDisplayName()
                            : "HappenStance Member";

                    String headline = null;
                    if (profile != null) {
                        String visibility = profile.getVisibility() != null
                                ? profile.getVisibility().toUpperCase(Locale.ROOT)
                                : "PUBLIC";
                        if (!"PRIVATE".equals(visibility)) {
                            headline = profile.getHeadline();
                        }
                    }

                    return new MutualConnectionMember(userId, displayName, headline);
                })
                .sorted(Comparator.comparing(
                        MutualConnectionMember::displayName,
                        String.CASE_INSENSITIVE_ORDER
                ))
                .toList();

        return new MutualConnectionsResponse(members.size(), members);
    }

    private Set<String> getAcceptedConnectionUserIds(String userId) {
        List<Relationship> sent =
                relationships.findBySourceUserIdAndStatus(userId, ACCEPTED);
        List<Relationship> received =
                relationships.findByTargetUserIdAndStatus(userId, ACCEPTED);

        Set<String> ids = new HashSet<>();
        for (Relationship r : sent) {
            if (r.getTargetUserId() != null && !r.getTargetUserId().equals(userId)) {
                ids.add(r.getTargetUserId());
            }
        }
        for (Relationship r : received) {
            if (r.getSourceUserId() != null && !r.getSourceUserId().equals(userId)) {
                ids.add(r.getSourceUserId());
            }
        }
        return ids;
    }

    // Remove an accepted connection or relationship request.
    @DeleteMapping("/{relationshipId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeConnection(
            Authentication auth,
            @PathVariable String relationshipId) {

        String userId = authenticatedUserId(auth);
        Relationship relationship = getRelationship(relationshipId);

        boolean participant =
                userId.equals(relationship.getSourceUserId())
                || userId.equals(relationship.getTargetUserId());

        if (!participant) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not part of this relationship."
            );
        }

        relationships.delete(relationship);
    }

    private boolean isActive(Relationship relationship) {

        if (relationship == null) {
            return false;
        }

        return PENDING.equals(relationship.getStatus())
                || ACCEPTED.equals(relationship.getStatus());
    }

    private void requireRecipient(
            Relationship relationship,
            String userId) {

        if (!userId.equals(relationship.getTargetUserId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the recipient can perform this action."
            );
        }
    }

    private void requirePending(Relationship relationship) {

        if (!PENDING.equals(relationship.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This request is no longer pending."
            );
        }
    }

    private String authenticatedUserId(Authentication auth) {

        if (auth == null
                || auth.getName() == null
                || auth.getName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required."
            );
        }

        return auth.getName();
    }

    private Relationship getRelationship(String id) {

        if (id == null || id.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Relationship ID is required."
            );
        }

        return relationships.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Relationship not found."
                ));
    }
}
