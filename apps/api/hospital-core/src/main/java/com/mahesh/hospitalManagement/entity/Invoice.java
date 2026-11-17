package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "invoice",
        indexes = {
                @Index(name = "idx_invoice_number", columnList = "invoiceNumber"),
                @Index(name = "idx_invoice_idempotency", columnList = "idempotencyKey")
        }
)
public class Invoice extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(unique = true, length = 100)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @OneToOne
    @JoinColumn(name = "consultation_id")
    private OPDConsultation consultation;

    @Column(nullable = false)
    private Double subtotal;

    private Double discountAmount;

    private String discountReason;

    private String discountApprovedBy;

    @Column(nullable = false)
    private Double gstAmount;

    @Column(nullable = false)
    private Double grandTotal;

    @Column(nullable = false, length = 30)
    private String paymentStatus; // PENDING, PAID, REFUNDED

    @Column(length = 30)
    private String paymentMethod; // CASH, CARD, UPI

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();
}
