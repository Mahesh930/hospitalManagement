package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, UUID> {
    List<FeatureFlag> findByHospitalId(UUID hospitalId);
    Optional<FeatureFlag> findByHospitalIdAndModuleCode(UUID hospitalId, String moduleCode);
}
