package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * Entity representing an Inpatient Clinical Progress Note recorded during doctor ward rounds.
 * Structured with SOAP (Subjective, Objective, Assessment, Plan) methodology.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "inpatient_progress_notes",
        indexes = {
                @Index(name = "idx_ipd_note_admission", columnList = "bed_admission_id"),
                @Index(name = "idx_ipd_note_patient", columnList = "patient_id"),
                @Index(name = "idx_ipd_note_doctor", columnList = "doctor_id"),
                @Index(name = "idx_ipd_note_time", columnList = "round_date_time")
        }
)
@SQLRestriction("deleted_at IS NULL")
public class InpatientProgressNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id", nullable = false)
    private BedAdmission bedAdmission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    /**
     * WARD_ROUND, SOAP_NOTE, EMERGENCY_REVIEW, CONSULTATION, DISCHARGE_SUMMARY
     */
    @Column(name = "note_type", nullable = false, length = 50)
    @Builder.Default
    private String noteType = "WARD_ROUND";

    @Column(name = "round_date_time", nullable = false)
    private LocalDateTime roundDateTime;

    // SOAP Format
    @Column(columnDefinition = "TEXT")
    private String subjective; // Patient symptoms, complaints, communication

    @Column(columnDefinition = "TEXT")
    private String objective;  // Physical exam, vitals, test results

    @Column(columnDefinition = "TEXT")
    private String assessment; // Clinical interpretation, progress status

    @Column(columnDefinition = "TEXT")
    private String plan;       // Medication adjustment, procedures, discharge plan

    // Vitals Snapshot
    private String bloodPressure;
    private Double pulseRate;
    private Double temperature;
    private Double spo2;
    private Double respiratoryRate;

    @Column(name = "is_critical")
    @Builder.Default
    private Boolean isCritical = false;

    @Column(columnDefinition = "TEXT")
    private String clinicalInstructions;
}
