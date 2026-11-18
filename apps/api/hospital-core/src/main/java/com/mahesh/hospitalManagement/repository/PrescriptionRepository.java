package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {
    Optional<Prescription> findByConsultationId(UUID consultationId);
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<Prescription> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId);
}
