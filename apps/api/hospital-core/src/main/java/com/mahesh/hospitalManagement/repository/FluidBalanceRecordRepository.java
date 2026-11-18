package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.FluidBalanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FluidBalanceRecordRepository extends JpaRepository<FluidBalanceRecord, UUID> {

    List<FluidBalanceRecord> findByPatientIdAndDeletedAtIsNullOrderByRecordedAtDesc(UUID patientId);

    List<FluidBalanceRecord> findByPatientIdAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtAsc(
            UUID patientId, LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT f FROM FluidBalanceRecord f WHERE f.patient.id = :patientId AND f.bedAdmission.id = :admissionId AND f.deletedAt IS NULL ORDER BY f.recordedAt DESC")
    List<FluidBalanceRecord> findByPatientAndAdmission(
            @Param("patientId") UUID patientId,
            @Param("admissionId") UUID admissionId);
}
