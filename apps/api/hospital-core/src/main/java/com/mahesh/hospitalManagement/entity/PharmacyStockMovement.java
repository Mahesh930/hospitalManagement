package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Audit ledger record for all medicine stock adjustments, receipts, issues, and returns.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pharmacy_stock_movement")
public class PharmacyStockMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private MedicineCatalogue medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    private MedicineBatch batch;

    @Column(nullable = false, length = 50)
    private String movementType; // PURCHASE_RECEIPT, DISPENSE, PATIENT_RETURN, SUPPLIER_RETURN, STOCK_ADJUSTMENT, TRANSFER, WRITE_OFF, QUARANTINE, RECALL

    @Column(nullable = false)
    private Integer quantity; // Signed (+ for addition, - for reduction)

    @Column(nullable = false)
    private Integer balanceAfter;

    @Column(length = 80)
    private String referenceNumber; // PO Number, Dispense ID, Return ID, Adjustment No

    @Column(length = 255)
    private String reason;

    @Column(nullable = false, length = 100)
    private String performedBy;
}
