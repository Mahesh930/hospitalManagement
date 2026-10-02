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
public class DoctorInvestigationResultDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private String testName;
    private String category;
    private LocalDateTime bookingDateTime;
    private String status;
    private UUID referringDoctorId;
    private String referringDoctorName;
    private String departmentName;
    private String instructions;
    private String clinicalNotes;
    private String resultNotes;
    private String resultAttachmentUrl;
    private LocalDateTime resultRecordedAt;
    private Boolean isAbnormal;
}
