package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByProviderIdAndProviderType(String providerId, AuthProviderType authProviderType);

    /**
     * Flexible user lookup by username, email, or mobile phone number for authentication.
     */
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND (u.username = :identifier OR u.phone = :identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND (" +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.hospital.id = :hospitalId AND (" +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchUsersByHospital(@Param("search") String search, @Param("hospitalId") UUID hospitalId, Pageable pageable);

    long countByHospitalId(UUID hospitalId);
}