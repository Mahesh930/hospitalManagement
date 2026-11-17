package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing clinical nursing progress notes, observations, and shift handover records.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "nursing_notes",
        indexes = {
                @Index(name = "idx_nursing_patient", columnList = "patient_id"),
                @Index(name = "idx_nursing_admission", columnList = "bed_admission_id"),
                @Index(name = "idx_nursing_recorded_at", columnList = "recordedAt")
        }
)
public class NursingNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_visit_id")
    private PatientVisit patientVisit;

    @Column(nullable = false, length = 50)
    private String noteType; // ASSESSMENT, PROGRESS, PROCEDURE, HANDOVER, DOCTOR_ORDER_EXECUTION

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, length = 100)
    private String nurseName;

    @Column(nullable = false)
    private LocalDateTime recordedAt;
}
