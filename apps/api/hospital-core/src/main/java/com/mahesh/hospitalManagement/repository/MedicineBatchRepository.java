package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, UUID> {

    List<MedicineBatch> findByMedicineIdAndDeletedAtIsNullOrderByExpiryDateAsc(UUID medicineId);

    Optional<MedicineBatch> findByMedicineIdAndBatchNumberAndDeletedAtIsNull(UUID medicineId, String batchNumber);

    List<MedicineBatch> findByDeletedAtIsNullOrderByExpiryDateAsc();

    @Query("SELECT b FROM MedicineBatch b WHERE b.deletedAt IS NULL AND b.expiryDate <= :targetDate AND b.quantityOnHand > 0 ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findNearExpiryBatches(@Param("targetDate") LocalDate targetDate);

    @Query("SELECT b FROM MedicineBatch b WHERE b.deletedAt IS NULL AND b.quantityOnHand <= :threshold ORDER BY b.quantityOnHand ASC")
    List<MedicineBatch> findLowStockBatches(@Param("threshold") Integer threshold);

    @Query("SELECT b FROM MedicineBatch b WHERE b.deletedAt IS NULL AND (LOWER(b.medicine.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(b.batchNumber) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<MedicineBatch> searchBatches(@Param("query") String query);
}
