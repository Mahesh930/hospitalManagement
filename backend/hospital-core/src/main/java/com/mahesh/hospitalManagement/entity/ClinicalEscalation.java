package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing clinical escalations, urgent doctor alerts,
 * and emergency responses (abnormal vitals, rapid response, code events).
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "clinical_escalations",
        indexes = {
                @Index(name = "idx_esc_ward", columnList = "ward_id"),
                @Index(name = "idx_esc_patient", columnList = "patient_id"),
                @Index(name = "idx_esc_severity", columnList = "severity"),
                @Index(name = "idx_esc_acknowledged", columnList = "isAcknowledged")
        }
)
public class ClinicalEscalation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    /**
     * ROUTINE, URGENT, CRITICAL
     */
    @Column(nullable = false, length = 20)
    private String severity;

    /**
     * ABNORMAL_VITALS, PATIENT_DETERIORATION, ADVERSE_REACTION, EMERGENCY_CODE
     */
    @Column(nullable = false, length = 50)
    private String triggerReason;

    @Column(nullable = false, length = 1000)
    private String clinicalNotes;

    @Column(nullable = false, length = 100)
    private String escalatedBy;

    @Column(nullable = false)
    private LocalDateTime escalatedAt;

    @Column(length = 100)
    private String attendingDoctorName;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isAcknowledged = false;

    @Column(length = 100)
    private String acknowledgedByDoctor;

    private LocalDateTime acknowledgedAt;

    @Column(length = 1000)
    private String doctorResponseNotes;
}
