package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing an Intake / Output (Fluid Balance) record.
 * Tracks all fluids administered/ingested and fluids lost/drained,
 * allowing calculation of net 24-hour fluid balance and fluid overload risk.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "fluid_balance_records",
        indexes = {
                @Index(name = "idx_fluid_patient", columnList = "patient_id"),
                @Index(name = "idx_fluid_admission", columnList = "bed_admission_id"),
                @Index(name = "idx_fluid_recorded_at", columnList = "recordedAt"),
                @Index(name = "idx_fluid_type", columnList = "recordType")
        }
)
public class FluidBalanceRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    /**
     * INTAKE or OUTPUT
     */
    @Column(nullable = false, length = 20)
    private String recordType;

    /**
     * Subcategory:
     * Intake: ORAL, IV_FLUID, TUBE_FEED, BLOOD_PRODUCT, OTHER_INTAKE
     * Output: URINE, SURGICAL_DRAIN, VOMIT, NG_ASPIRATE, BOWEL, OTHER_OUTPUT
     */
    @Column(nullable = false, length = 50)
    private String subCategory;

    /**
     * Volume in milliliters (ml)
     */
    @Column(nullable = false)
    private Double amountMl;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    @Column(nullable = false, length = 100)
    private String recordedBy;

    @Column(length = 500)
    private String notes;
}
