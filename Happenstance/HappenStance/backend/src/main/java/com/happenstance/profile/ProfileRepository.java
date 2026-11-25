package com.happenstance.profile;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends MongoRepository<Profile, String> {
    Optional<Profile> findByUserId(String userId);
    List<Profile> findByUserIdIn(Collection<String> userIds);
}
