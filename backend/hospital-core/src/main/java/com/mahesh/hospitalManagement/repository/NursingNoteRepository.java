package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.NursingNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NursingNoteRepository extends JpaRepository<NursingNote, UUID> {

    List<NursingNote> findByPatientIdAndDeletedAtIsNullOrderByRecordedAtDesc(UUID patientId);

    List<NursingNote> findByBedAdmissionIdAndDeletedAtIsNullOrderByRecordedAtDesc(UUID bedAdmissionId);

    List<NursingNote> findByPatientVisitIdAndDeletedAtIsNullOrderByRecordedAtDesc(UUID patientVisitId);
}
