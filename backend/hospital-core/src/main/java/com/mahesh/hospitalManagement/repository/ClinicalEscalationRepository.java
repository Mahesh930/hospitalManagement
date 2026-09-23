package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.ClinicalEscalation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClinicalEscalationRepository extends JpaRepository<ClinicalEscalation, UUID> {

    List<ClinicalEscalation> findByWardIdAndDeletedAtIsNullOrderByEscalatedAtDesc(UUID wardId);

    List<ClinicalEscalation> findByWardIdAndIsAcknowledgedFalseAndDeletedAtIsNullOrderByEscalatedAtDesc(UUID wardId);

    List<ClinicalEscalation> findByPatientIdAndDeletedAtIsNullOrderByEscalatedAtDesc(UUID patientId);
}
