package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PharmacyPurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PharmacyPurchaseOrderRepository extends JpaRepository<PharmacyPurchaseOrder, UUID> {
    Optional<PharmacyPurchaseOrder> findByPoNumber(String poNumber);
    List<PharmacyPurchaseOrder> findAllByOrderByOrderDateDesc();
    List<PharmacyPurchaseOrder> findByStatusOrderByOrderDateDesc(String status);
}
