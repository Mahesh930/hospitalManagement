package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PharmacyDispenseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PharmacyDispenseRecordRepository extends JpaRepository<PharmacyDispenseRecord, UUID> {

    Optional<PharmacyDispenseRecord> findByDispenseNumber(String dispenseNumber);

    List<PharmacyDispenseRecord> findByPatientIdOrderByDispenseDateDesc(UUID patientId);

    List<PharmacyDispenseRecord> findByPrescriptionId(UUID prescriptionId);

    List<PharmacyDispenseRecord> findTop50ByOrderByDispenseDateDesc();

    @Query("SELECT r FROM PharmacyDispenseRecord r WHERE r.dispenseDate BETWEEN :start AND :end ORDER BY r.dispenseDate DESC")
    List<PharmacyDispenseRecord> findDispensesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
