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

    private Integer durationDays;

    @Column(length = 100)
    private String instructions; // e.g., After meals
}
