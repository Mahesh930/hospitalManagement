package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing standardized clinical nursing risk assessments and checklists:
 * 1. Morse Fall Risk Scale
 * 2. Braden Scale for Pressure Ulcer Risk
 * 3. Mobility and Functional Independence Assessment
 * 4. Pre-Operative / Pre-Procedural Surgical Safety Checklist
 * 5. Discharge Preparation & Handover Checklist
 * 6. Infection Control & Isolation Precautions Assessment
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "nursing_assessments",
        indexes = {
                @Index(name = "idx_assess_patient", columnList = "patient_id"),
                @Index(name = "idx_assess_admission", columnList = "bed_admission_id"),
                @Index(name = "idx_assess_type", columnList = "assessmentType"),
                @Index(name = "idx_assess_at", columnList = "assessedAt")
        }
)
public class NursingAssessment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    /**
     * FALL_RISK_MORSE, PRESSURE_ULCER_BRADEN, MOBILITY_ASSESSMENT,
     * PRE_OP_CHECKLIST, DISCHARGE_CHECKLIST, INFECTION_CONTROL
     */
    @Column(nullable = false, length = 50)
    private String assessmentType;

    /**
     * Calculated total score (e.g., Morse Score: 0-125, Braden Score: 6-23)
     */
    private Integer totalScore;

    /**
     * Categorized clinical risk level: LOW, MODERATE, HIGH, CRITICAL
     */
    @Column(length = 30)
    private String riskLevel;

    /**
     * Structured JSON/key-value storage for specific questionnaire answers or checklist toggles
     */
    @Column(columnDefinition = "TEXT")
    private String findingsJson;

    @Column(length = 1000)
    private String clinicalSummary;

    @Column(nullable = false, length = 100)
    private String assessedBy;

    @Column(nullable = false)
    private LocalDateTime assessedAt;
}
