package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.BedAdmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BedAdmissionRepository extends JpaRepository<BedAdmission, UUID> {

    List<BedAdmission> findByPatientIdAndDeletedAtIsNullOrderByAdmissionTimeDesc(UUID patientId);

    Optional<BedAdmission> findByBedIdAndStatusAndDeletedAtIsNull(UUID bedId, String status);

    Optional<BedAdmission> findByPatientIdAndStatusAndDeletedAtIsNull(UUID patientId, String status);

    @Query("SELECT ba FROM BedAdmission ba WHERE ba.bed.hospital.id = :hospitalId AND ba.status = 'ADMITTED' AND ba.deletedAt IS NULL ORDER BY ba.admissionTime DESC")
    List<BedAdmission> findActiveAdmissionsByHospital(@Param("hospitalId") UUID hospitalId);
}
