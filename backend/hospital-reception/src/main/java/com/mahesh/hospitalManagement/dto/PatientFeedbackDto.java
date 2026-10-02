package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientFeedbackDto {

    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private String contactPhone;
    private String category; // COMPLAINT, SERVICE_REQUEST, SUGGESTION, COMPLIMENT
    private String subject;
    private String description;
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    private String recordedBy;
    private String assignedDepartment;
    private String resolutionNotes;
    private String resolvedBy;
    private LocalDateTime createdAt;
}
