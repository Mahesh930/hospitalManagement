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
public class NursingNoteDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private UUID bedAdmissionId;
    private UUID patientVisitId;
    private String noteType; // ASSESSMENT, PROGRESS, PROCEDURE, HANDOVER
    private String content;
    private String nurseName;
    private LocalDateTime recordedAt;
}
