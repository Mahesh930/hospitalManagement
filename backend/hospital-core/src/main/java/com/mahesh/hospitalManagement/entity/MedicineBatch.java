package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Entity representing an inventory batch of a specific medicine in MediCore ERP Pharmacy.
 * Enforces FEFO (First-Expiry-First-Out) dispensing and quarantine workflows.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "medicine_batch")
public class MedicineBatch extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private MedicineCatalogue medicine;

    @Column(nullable = false, length = 60)
    private String batchNumber;

    @Column(nullable = false)
    private LocalDate expiryDate;

    private LocalDate mfgDate;

    private Double purchasePrice;

    private Double mrp;

    private Double sellingPrice;

    @Builder.Default
    private Integer quantityOnHand = 0;

    @Builder.Default
    private Integer quarantinedQuantity = 0;

    @Column(length = 100)
    private String storageLocation; // e.g. Rack A-12, Bin 3, Cold Chain Refrigerator 1

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, NEAR_EXPIRY, EXPIRED, QUARANTINED, RECALLED

    @Column(length = 150)
    private String supplierName;

    @Column(length = 255)
    private String notes;
}
