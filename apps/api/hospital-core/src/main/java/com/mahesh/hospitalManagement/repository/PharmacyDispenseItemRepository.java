package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PharmacyDispenseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PharmacyDispenseItemRepository extends JpaRepository<PharmacyDispenseItem, UUID> {
    List<PharmacyDispenseItem> findByDispenseRecordId(UUID dispenseRecordId);
    List<PharmacyDispenseItem> findByBatchId(UUID batchId);
}
