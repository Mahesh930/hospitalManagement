package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByIdempotencyKey(String idempotencyKey);
    Optional<Invoice> findByConsultationId(UUID consultationId);
    long countByPaymentStatus(String paymentStatus);
}
