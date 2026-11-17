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
public class NursingCareRecordDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID bedAdmissionId;
    private String careType; // WOUND_DRESSING, CATHETER_CARE, IV_LINE_MONITORING, DRAIN_CARE, REPOSITIONING, HYGIENE_CARE, OXYGEN_THERAPY, NEBULIZATION, BLOOD_TRANSFUSION
    private String siteOrDevice;
    private String statusOrCondition;
    private String details;
    private String performedBy;
    private LocalDateTime performedAt;
}
