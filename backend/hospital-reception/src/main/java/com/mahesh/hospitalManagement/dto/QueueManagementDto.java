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
public class QueueManagementDto {
    private UUID visitId;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID doctorId;
    private String doctorName;
    private String tokenNumber;
    private Integer priorityRank;
    private String status;
    private LocalDateTime checkInTime;
    private Boolean isAbnormalVitals;
    private String notes;
}
