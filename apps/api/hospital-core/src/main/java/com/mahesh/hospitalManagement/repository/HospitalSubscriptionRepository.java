package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.HospitalSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HospitalSubscriptionRepository extends JpaRepository<HospitalSubscription, UUID> {
    Optional<HospitalSubscription> findByHospitalIdAndStatus(UUID hospitalId, String status);
}
