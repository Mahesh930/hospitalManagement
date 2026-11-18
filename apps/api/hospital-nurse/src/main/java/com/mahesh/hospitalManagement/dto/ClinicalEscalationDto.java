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
public class ClinicalEscalationDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID bedAdmissionId;
    private UUID wardId;
    private String wardName;
    private String severity; // ROUTINE, URGENT, CRITICAL
    private String triggerReason; // ABNORMAL_VITALS, PATIENT_DETERIORATION, ADVERSE_REACTION, EMERGENCY_CODE
    private String clinicalNotes;
    private String escalatedBy;
    private LocalDateTime escalatedAt;
    private String attendingDoctorName;
    private Boolean isAcknowledged;
    private String acknowledgedByDoctor;
    private LocalDateTime acknowledgedAt;
    private String doctorResponseNotes;
}
