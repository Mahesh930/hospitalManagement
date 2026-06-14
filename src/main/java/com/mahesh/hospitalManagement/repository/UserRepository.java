package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for User entity operations.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their username.
     * @param username The username to search for.
     * @return An Optional containing the User if found.
     */
    Optional<User> findByUsername(String username);

    /**
     * Finds a user by their provider ID and authentication provider type (for OAuth2).
     * @param providerId Unique ID from the auth provider.
     * @param authProviderType Type of auth provider (e.g., GOOGLE).
     * @return An Optional containing the User if found.
     */
    Optional<User> findByProviderIdAndProviderType(String providerId, AuthProviderType authProviderType);
}