package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDate;

/**
 * Entity representing shift handovers between pharmacy staff members.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pharmacy_shift_handover")
public class PharmacyShiftHandover extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String shiftName; // Morning, Evening, Night

    @Column(nullable = false)
    private LocalDate handoverDate;

    @Column(nullable = false, length = 100)
    private String outgoingPharmacist;

    @Column(length = 100)
    private String incomingPharmacist;

    @Builder.Default
    private Integer pendingPrescriptionsCount = 0;

    @Builder.Default
    private Integer lowStockItemsCount = 0;

    @Column(columnDefinition = "TEXT")
    private String criticalAlerts;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 50)
    @Builder.Default
    private String status = "HANDED_OVER"; // HANDED_OVER, ACKNOWLEDGED
}
