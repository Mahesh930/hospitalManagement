package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.NursingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NursingTaskRepository extends JpaRepository<NursingTask, UUID> {

    List<NursingTask> findByWardIdAndDeletedAtIsNullOrderByScheduledAtAsc(UUID wardId);

    List<NursingTask> findByWardIdAndStatusAndDeletedAtIsNullOrderByScheduledAtAsc(UUID wardId, String status);

    List<NursingTask> findByPatientIdAndDeletedAtIsNullOrderByScheduledAtDesc(UUID patientId);
}
