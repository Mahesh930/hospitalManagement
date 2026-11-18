package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalTimelineEventDto {
    private LocalDateTime timestamp;
    private String eventType; // CONSULTATION, VITALS, INVESTIGATION, PRESCRIPTION, PROGRESS_NOTE, CERTIFICATE, ADMISSION
    private String title;
    private String summary;
    private String performerName;
    private String severity; // NORMAL, ALERT, CRITICAL
}
