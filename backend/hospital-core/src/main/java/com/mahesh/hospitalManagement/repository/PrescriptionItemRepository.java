package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, UUID> {

    List<PrescriptionItem> findByPrescriptionIdAndDeletedAtIsNull(UUID prescriptionId);

    @Query("SELECT pi FROM PrescriptionItem pi WHERE pi.prescription.patient.id = :patientId AND pi.deletedAt IS NULL ORDER BY pi.createdAt DESC")
    List<PrescriptionItem> findByPatientIdOrderByCreatedAtDesc(@Param("patientId") UUID patientId);
}
