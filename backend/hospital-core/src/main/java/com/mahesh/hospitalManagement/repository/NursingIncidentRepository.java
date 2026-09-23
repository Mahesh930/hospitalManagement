package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.NursingIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NursingIncidentRepository extends JpaRepository<NursingIncident, UUID> {

    List<NursingIncident> findByWardIdAndDeletedAtIsNullOrderByReportedAtDesc(UUID wardId);

    List<NursingIncident> findByPatientIdAndDeletedAtIsNullOrderByReportedAtDesc(UUID patientId);
}
