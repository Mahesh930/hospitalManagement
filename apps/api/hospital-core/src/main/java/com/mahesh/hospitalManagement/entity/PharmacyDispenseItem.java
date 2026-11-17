package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Line item within a pharmacy dispensing record.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pharmacy_dispense_item")
public class PharmacyDispenseItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispense_record_id", nullable = false)
    private PharmacyDispenseRecord dispenseRecord;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private MedicineCatalogue medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    private MedicineBatch batch;

    @Column(nullable = false)
    private Integer quantityDispensed;

    private Double unitPrice;

    private Double totalPrice;

    @Column(length = 200)
    private String dosageInstructions;
}
