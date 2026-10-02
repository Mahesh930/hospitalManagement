package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PatientMergeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PatientMergeRequestRepository extends JpaRepository<PatientMergeRequest, UUID> {
    List<PatientMergeRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<PatientMergeRequest> findAllByOrderByCreatedAtDesc();
}
