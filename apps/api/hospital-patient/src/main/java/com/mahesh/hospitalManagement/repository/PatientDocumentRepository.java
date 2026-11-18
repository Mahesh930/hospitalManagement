package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PatientDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PatientDocumentRepository extends JpaRepository<PatientDocument, UUID> {

    List<PatientDocument> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    List<PatientDocument> findByPatientIdAndDocType(UUID patientId, String docType);
}
