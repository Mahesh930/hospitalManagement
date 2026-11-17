package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing an individual hospital bed in a ward.
 * Tracks bed status (AVAILABLE, OCCUPIED, MAINTENANCE), bed number, and tariff.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "beds",
        indexes = {
                @Index(name = "idx_bed_ward", columnList = "ward_id"),
                @Index(name = "idx_bed_status", columnList = "status"),
                @Index(name = "idx_bed_hospital", columnList = "hospital_id")
        }
)
public class Bed extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(nullable = false, length = 50)
    private String bedNumber; // e.g. "BED-101", "ICU-04"

    @Column(nullable = false, length = 30)
    private String status; // AVAILABLE, OCCUPIED, MAINTENANCE, CLEANING

    private Double dailyRate;

    @Column(length = 255)
    private String notes;
}
