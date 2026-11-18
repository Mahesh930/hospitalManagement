package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Hospital;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, UUID> {
    Optional<Hospital> findByRegistrationNumber(String registrationNumber);

    @Query("SELECT h FROM Hospital h WHERE h.deletedAt IS NULL AND (" +
           "LOWER(h.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(h.registrationNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Hospital> searchActiveHospitals(@Param("search") String search, Pageable pageable);

    @Query("SELECT h FROM Hospital h WHERE h.deletedAt IS NULL")
    List<Hospital> findAllActive();

    @Query("SELECT h FROM Hospital h WHERE h.deletedAt IS NULL AND h.status = :status")
    List<Hospital> findAllByStatus(@Param("status") String status);

    @Query("SELECT COUNT(h) FROM Hospital h WHERE h.deletedAt IS NULL")
    long countActive();

    @Query("SELECT COUNT(h) FROM Hospital h WHERE h.deletedAt IS NULL AND h.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(h) FROM Hospital h WHERE h.deletedAt IS NULL AND h.isSuspended = true")
    long countSuspended();
}
