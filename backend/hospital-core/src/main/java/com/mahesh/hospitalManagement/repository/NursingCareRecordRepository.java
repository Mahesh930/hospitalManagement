package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.NursingCareRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NursingCareRecordRepository extends JpaRepository<NursingCareRecord, UUID> {

    List<NursingCareRecord> findByPatientIdAndDeletedAtIsNullOrderByPerformedAtDesc(UUID patientId);

    List<NursingCareRecord> findByPatientIdAndCareTypeAndDeletedAtIsNullOrderByPerformedAtDesc(
            UUID patientId, String careType);
}
