package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientMergeRequestDto {

    private UUID id;
    private UUID sourcePatientId;
    private String sourcePatientUhid;
    private String sourcePatientName;
    private UUID targetPatientId;
    private String targetPatientUhid;
    private String targetPatientName;
    private String reason;
    private String status; // PENDING, APPROVED, REJECTED
    private String requestedBy;
    private String reviewedBy;
    private String reviewNotes;
    private LocalDateTime createdAt;
}
