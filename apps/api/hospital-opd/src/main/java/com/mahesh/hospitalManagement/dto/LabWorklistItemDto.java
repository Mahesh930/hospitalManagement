package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Worklist item representing a laboratory or diagnostic investigation order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabWorklistItemDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private String testName;
    private String category; // LAB, RADIOLOGY, CARDIOLOGY, PATHOLOGY, OTHER
    private LocalDateTime bookingDateTime;
    private String status; // SCHEDULED, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED, CANCELLED
    private UUID referringDoctorId;
    private String referringDoctorName;
    private String departmentName;
    private String instructions;
    private String clinicalNotes;
    private String resultNotes;
    private String resultAttachmentUrl;
    private LocalDateTime resultRecordedAt;
    private Boolean isAbnormal;
    private String bookedBy;
    private LocalDateTime createdAt;
}

