package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing a clinical hospital ward (e.g. ICU, General Ward, Semi-Private, Emergency).
 * Tracks the ward's hospital affiliation, floor location, capacity, and department mapping.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "wards",
        indexes = {
                @Index(name = "idx_ward_hospital", columnList = "hospital_id"),
                @Index(name = "idx_ward_type", columnList = "wardType")
        }
)
public class Ward extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String wardType; // GENERAL, ICU, SEMI_PRIVATE, EMERGENCY, PEDIATRIC, POST_OP

    @Column(nullable = false)
    private Integer totalBeds;

    @Column(length = 50)
    private String floorNumber;

    @Column(length = 255)
    private String description;
}
