package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "prescription_item")
public class PrescriptionItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(nullable = false, length = 100)
    private String medicineName;

    @Column(length = 50)
    private String dosage; // e.g., 500mg, 1 tablet

    @Column(length = 50)
    private String frequency; // e.g., 1-0-1 (twice daily)

    @Column(length = 50)
    private String route; // Oral, IV, IM, Subcutaneous, Topical, Inhalation

    private Integer durationDays;

    private Integer quantity; // Total units/tablets to dispense

    @Column(length = 100)
    private String instructions; // e.g., After meals

    @Builder.Default
    private Integer dispensedQuantity = 0;

    @Column(length = 50)
    private String batchNumber;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, DISPENSED, PARTIAL, OUT_OF_STOCK, SUBSTITUTED

    @Column(length = 255)
    private String substitutionReason;
}
