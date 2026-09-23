package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.NursingAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NursingAssessmentRepository extends JpaRepository<NursingAssessment, UUID> {

    List<NursingAssessment> findByPatientIdAndDeletedAtIsNullOrderByAssessedAtDesc(UUID patientId);

    List<NursingAssessment> findByPatientIdAndAssessmentTypeAndDeletedAtIsNullOrderByAssessedAtDesc(
            UUID patientId, String assessmentType);
}
