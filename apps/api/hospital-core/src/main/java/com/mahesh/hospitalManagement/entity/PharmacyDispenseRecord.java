package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing an official pharmacy medicine dispensing transaction.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pharmacy_dispense_record")
public class PharmacyDispenseRecord extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String dispenseNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 100)
    private String pharmacistUsername;

    @Builder.Default
    private LocalDateTime dispenseDate = LocalDateTime.now();

    private Double totalAmount;

    @Column(length = 50)
    @Builder.Default
    private String paymentStatus = "PAID"; // PAID, PENDING_BILLING, EXEMPT

    @Column(length = 50)
    @Builder.Default
    private String status = "DISPENSED"; // DISPENSED, PARTIALLY_DISPENSED, CANCELLED, RETURNED

    @Column(length = 100)
    private String handoverTo; // Self, Attendant, Inpatient Ward Nurse

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private UUID invoiceId; // Link to Billing module invoice if generated

    @OneToMany(mappedBy = "dispenseRecord", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<PharmacyDispenseItem> items = new ArrayList<>();
}
