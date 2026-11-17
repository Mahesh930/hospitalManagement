package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.InpatientProgressNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InpatientProgressNoteRepository extends JpaRepository<InpatientProgressNote, UUID> {
    List<InpatientProgressNote> findByBedAdmissionIdOrderByRoundDateTimeDesc(UUID bedAdmissionId);
    List<InpatientProgressNote> findByPatientIdOrderByRoundDateTimeDesc(UUID patientId);
    List<InpatientProgressNote> findByDoctorIdOrderByRoundDateTimeDesc(UUID doctorId);
}
