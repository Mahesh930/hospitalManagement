package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosticBookingDto {

    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private String testName;
    private String category; // LAB, RADIOLOGY, CARDIOLOGY, PATHOLOGY, OTHER
    private LocalDateTime bookingDateTime;
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    private UUID referringDoctorId;
    private String referringDoctorName;
    private String departmentName;
    private String instructions;
    private String bookedBy;
    private LocalDateTime createdAt;
}
