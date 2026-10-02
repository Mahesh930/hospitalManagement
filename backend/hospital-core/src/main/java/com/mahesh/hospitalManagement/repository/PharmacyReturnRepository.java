package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PharmacyReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PharmacyReturnRepository extends JpaRepository<PharmacyReturn, UUID> {
    Optional<PharmacyReturn> findByReturnNumber(String returnNumber);
    List<PharmacyReturn> findAllByOrderByCreatedAtDesc();
    List<PharmacyReturn> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
