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

    @Query("SELECT ba FROM BedAdmission ba WHERE ba.bed.ward.id = :wardId AND ba.status = 'ADMITTED' AND ba.deletedAt IS NULL ORDER BY ba.admissionTime DESC")
    List<BedAdmission> findActiveAdmissionsByWard(@Param("wardId") UUID wardId);

    @Query("SELECT ba FROM BedAdmission ba WHERE ba.status = 'ADMITTED' AND ba.deletedAt IS NULL ORDER BY ba.admissionTime DESC")
    List<BedAdmission> findAllActiveAdmissions();

    @Query("SELECT ba FROM BedAdmission ba WHERE ba.patient.id = :patientId AND ba.bed.ward.id = :wardId AND ba.status = 'ADMITTED' AND ba.deletedAt IS NULL")
    Optional<BedAdmission> findActiveAdmissionByPatientAndWard(@Param("patientId") UUID patientId, @Param("wardId") UUID wardId);

    @Query("SELECT ba FROM BedAdmission ba WHERE ba.patient.uhid = :uhid AND ba.bed.ward.id = :wardId AND ba.status = 'ADMITTED' AND ba.deletedAt IS NULL")
    Optional<BedAdmission> findActiveAdmissionByPatientUhidAndWard(@Param("uhid") String uhid, @Param("wardId") UUID wardId);
}
