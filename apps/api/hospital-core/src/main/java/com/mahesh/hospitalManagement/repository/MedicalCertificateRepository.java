package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.MedicalCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicalCertificateRepository extends JpaRepository<MedicalCertificate, UUID> {
    List<MedicalCertificate> findByPatientIdOrderByIssueDateDesc(UUID patientId);
    List<MedicalCertificate> findByDoctorIdOrderByIssueDateDesc(UUID doctorId);
    Optional<MedicalCertificate> findByCertificateNumber(String certificateNumber);
}
