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
public class NursingTaskDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID bedAdmissionId;
    private UUID wardId;
    private String wardName;
    private String taskTitle;
    private String description;
    private String taskType; // MEDICATION, VITALS_CHECK, DRESSING, LAB_COLLECTION, DOCTOR_ORDER, GENERAL_CARE, ASSESSMENT
    private String priority; // ROUTINE, URGENT, STAT
    private LocalDateTime scheduledAt;
    private LocalDateTime dueAt;
    private String status; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    private String assignedNurse;
    private String completedBy;
    private LocalDateTime completedAt;
    private String completionNotes;
}
