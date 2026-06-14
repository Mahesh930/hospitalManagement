package com.mahesh.hospitalManagement.repository;


import com.mahesh.hospitalManagement.dto.BloodGroupCountResponseEntity;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.entity.type.BloodGroupType;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for Patient entity operations.
 * Includes custom queries for advanced patient searches and statistics.
 */
public interface PatientRepository extends JpaRepository<Patient,Long> {

    /**
     * Finds a patient by their name.
     */
    Patient findByName(String name);

    /**
     * Finds patients by birth date or email.
     */
    List<Patient> findByBirthDateOrEmail(LocalDate birthDate, String email);

    /**
     * Finds patients born between two dates.
     */
    List<Patient> findByBirthDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Finds patients whose name contains the given query string, ordered by ID descending.
     */
    List<Patient> findByNameContainingOrderByIdDesc(String query);

    /**
     * Custom JPQL query to find patients by blood group.
     */
    @Query("SELECT p FROM Patient p where p.bloodGroup = ?1")
    List<Patient> findByBloodGroup(@Param("bloodGroup") BloodGroupType bloodGroup);

    /**
     * Custom JPQL query to find patients born after a specific date.
     */
    @Query("select p from Patient p where p.birthDate > :birthDate")
    List<Patient> findByBornAfterDate(@Param("birthDate") LocalDate birthDate);

    /**
     * Custom JPQL query to count the number of patients for each blood group.
     * Maps results directly to BloodGroupCountResponseEntity DTO.
     */
    @Query("select new com.mahesh.hospitalManagement.dto.BloodGroupCountResponseEntity(p.bloodGroup," +
            " Count(p)) from Patient p group by p.bloodGroup")
    List<BloodGroupCountResponseEntity> countEachBloodGroupType();

    /**
     * Native SQL query to fetch all patients with pagination support.
     */
    @Query(value = "select * from patient", nativeQuery = true)
    Page<Patient> findAllPatients(Pageable pageable);

    /**
     * Transactional update query to change a patient's name by ID.
     */
    @Transactional
    @Modifying
    @Query("UPDATE Patient p SET p.name = :name where p.id = :id")
    int updateNameWithId(@Param("name") String name, @Param("id") Long id);

    /**
     * Custom JPQL query to fetch patients along with their appointments using JOIN FETCH.
     * This helps avoid the N+1 select problem.
     */
    @Query("SELECT p FROM Patient p LEFT JOIN FETCH p.appointments ")
    List<Patient> findAllPatientWithAppointment();
}
