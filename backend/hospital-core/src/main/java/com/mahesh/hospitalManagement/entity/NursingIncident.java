package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing clinical and hospital incident reports logged by nursing staff:
 * Patient falls, medication administration errors or near-misses, equipment/device failure,
 * adverse drug reactions, infiltration, or patient injuries.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "nursing_incidents",
        indexes = {
                @Index(name = "idx_incident_ward", columnList = "ward_id"),
                @Index(name = "idx_incident_patient", columnList = "patient_id"),
                @Index(name = "idx_incident_type", columnList = "incidentType"),
                @Index(name = "idx_incident_reported_at", columnList = "reportedAt")
        }
)
public class NursingIncident extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    /**
     * PATIENT_FALL, MEDICATION_ERROR, EQUIPMENT_FAILURE, ADVERSE_DRUG_REACTION, INJURY, OTHER
     */
    @Column(nullable = false, length = 50)
    private String incidentType;

    /**
     * NEAR_MISS, MINOR, MODERATE, SEVERE
     */
    @Column(nullable = false, length = 30)
    private String severity;

    @Column(nullable = false)
    private LocalDateTime incidentTime;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, length = 1000)
    private String immediateActionTaken;

    @Column(nullable = false, length = 100)
    private String reportedBy;

    @Column(nullable = false)
    private LocalDateTime reportedAt;

    /**
     * REPORTED, UNDER_REVIEW, RESOLVED
     */
    @Builder.Default
    @Column(nullable = false, length = 30)
    private String investigationStatus = "REPORTED";

    @Column(length = 1000)
    private String resolutionNotes;
}
