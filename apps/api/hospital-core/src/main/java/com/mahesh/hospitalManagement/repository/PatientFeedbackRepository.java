package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PatientFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PatientFeedbackRepository extends JpaRepository<PatientFeedback, UUID> {
    List<PatientFeedback> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<PatientFeedback> findByStatusOrderByCreatedAtDesc(String status);
    List<PatientFeedback> findAllByOrderByCreatedAtDesc();
}
