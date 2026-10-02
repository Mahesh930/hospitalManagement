package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PharmacyStockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PharmacyStockMovementRepository extends JpaRepository<PharmacyStockMovement, UUID> {
    List<PharmacyStockMovement> findTop100ByOrderByCreatedAtDesc();
    List<PharmacyStockMovement> findByMedicineIdOrderByCreatedAtDesc(UUID medicineId);
    List<PharmacyStockMovement> findByBatchIdOrderByCreatedAtDesc(UUID batchId);
}
