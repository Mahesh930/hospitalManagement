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
public class NursingIncidentDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID bedAdmissionId;
    private UUID wardId;
    private String wardName;
    private String incidentType; // PATIENT_FALL, MEDICATION_ERROR, EQUIPMENT_FAILURE, ADVERSE_DRUG_REACTION, INJURY, OTHER
    private String severity; // NEAR_MISS, MINOR, MODERATE, SEVERE
    private LocalDateTime incidentTime;
    private String description;
    private String immediateActionTaken;
    private String reportedBy;
    private LocalDateTime reportedAt;
    private String investigationStatus; // REPORTED, UNDER_REVIEW, RESOLVED
    private String resolutionNotes;
}
