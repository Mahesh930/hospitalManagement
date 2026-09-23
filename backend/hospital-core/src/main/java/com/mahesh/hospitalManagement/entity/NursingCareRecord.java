package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing specialized bedside nursing care procedures:
 * Wound care, dressing changes, catheter care, surgical drain monitoring,
 * IV line/cannula status, patient repositioning (pressure injury prevention),
 * patient hygiene, oxygen therapy, and nebulization.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "nursing_care_records",
        indexes = {
                @Index(name = "idx_care_patient", columnList = "patient_id"),
                @Index(name = "idx_care_admission", columnList = "bed_admission_id"),
                @Index(name = "idx_care_type", columnList = "careType"),
                @Index(name = "idx_care_performed_at", columnList = "performedAt")
        }
)
public class NursingCareRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    /**
     * WOUND_DRESSING, CATHETER_CARE, IV_LINE_MONITORING, DRAIN_CARE,
     * REPOSITIONING, HYGIENE_CARE, OXYGEN_THERAPY, NEBULIZATION, BLOOD_TRANSFUSION
     */
    @Column(nullable = false, length = 50)
    private String careType;

    /**
     * Anatomical location or medical device identifier (e.g. "Left Forearm IV Cannula 20G", "Abdominal surgical wound", "Foley Catheter 16Fr")
     */
    @Column(length = 200)
    private String siteOrDevice;

    /**
     * Clinical status / condition (e.g. "Clean & Intact", "Mild erythema", "Patented", "Repositioned to Left Lateral")
     */
    @Column(length = 100)
    private String statusOrCondition;

    /**
     * Output or measurement details (e.g. "200ml serosanguinous fluid drained", "SpO2 98% on 2L/min Nasal Cannula")
     */
    @Column(length = 1000)
    private String details;

    @Column(nullable = false, length = 100)
    private String performedBy;

    @Column(nullable = false)
    private LocalDateTime performedAt;
}
