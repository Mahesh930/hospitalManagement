package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByIdempotencyKey(String idempotencyKey);
    Optional<Invoice> findByConsultationId(UUID consultationId);
    List<Invoice> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    long countByPaymentStatus(String paymentStatus);
    List<Invoice> findAllByOrderByCreatedAtDesc();

    @Query("SELECT i FROM Invoice i WHERE i.deletedAt IS NULL AND " +
            "(:status IS NULL OR :status = '' OR i.paymentStatus = :status) AND " +
            "(:query IS NULL OR :query = '' OR " +
            "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(i.patient.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(i.patient.uhid) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY i.createdAt DESC")
    List<Invoice> searchInvoices(@Param("query") String query, @Param("status") String status);
}
