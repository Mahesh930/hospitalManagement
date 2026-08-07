package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.dto.BloodGroupCountResponseEntity;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.entity.type.BloodGroupType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {

    Optional<Patient> findByUhid(String uhid);

    Optional<Patient> findByPhone(String phone);

    Optional<Patient> findByAbhaId(String abhaId);

    Optional<Patient> findByAadhaar(String aadhaar);

    List<Patient> findByNameContainingIgnoreCaseOrPhoneContainingOrUhidContaining(
            String name, String phone, String uhid);

    @Query("SELECT p FROM Patient p WHERE p.deletedAt IS NULL AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "p.phone LIKE CONCAT('%', :query, '%') OR " +
            "LOWER(p.uhid) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "(p.abhaId IS NOT NULL AND LOWER(p.abhaId) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
            "(p.aadhaar IS NOT NULL AND p.aadhaar LIKE CONCAT('%', :query, '%')))")
    List<Patient> searchPatients(@Param("query") String query);

    @Query("SELECT p FROM Patient p WHERE p.deletedAt IS NULL AND p.phone = :phone AND LOWER(p.name) = LOWER(:name)")
    List<Patient> findDuplicatesByPhoneAndName(@Param("phone") String phone, @Param("name") String name);

    @Query("SELECT p FROM Patient p WHERE p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    List<Patient> findAllActivePatients();

    List<Patient> findByBirthDateOrEmail(LocalDate birthDate, String email);

    @Query("SELECT p FROM Patient p WHERE p.bloodGroup = :bloodGroup AND p.deletedAt IS NULL")
    List<Patient> findByBloodGroup(@Param("bloodGroup") BloodGroupType bloodGroup);

    @Query("SELECT new com.mahesh.hospitalManagement.dto.BloodGroupCountResponseEntity(p.bloodGroup, COUNT(p)) " +
            "FROM Patient p WHERE p.deletedAt IS NULL GROUP BY p.bloodGroup")
    List<BloodGroupCountResponseEntity> countEachBloodGroupType();
}
