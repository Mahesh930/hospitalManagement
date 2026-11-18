package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NursingAssessmentDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID bedAdmissionId;
    private String assessmentType; // FALL_RISK_MORSE, PRESSURE_ULCER_BRADEN, MOBILITY_ASSESSMENT, PRE_OP_CHECKLIST, DISCHARGE_CHECKLIST, INFECTION_CONTROL
    private Integer totalScore;
    private String riskLevel; // LOW, MODERATE, HIGH, CRITICAL
    private String findingsJson;
    private String clinicalSummary;
    private String assessedBy;
    private LocalDateTime assessedAt;
}
