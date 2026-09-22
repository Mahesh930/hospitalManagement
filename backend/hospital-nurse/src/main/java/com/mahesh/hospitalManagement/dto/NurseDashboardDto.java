package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Real-time operational dashboard analytics for the Nurse Station.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NurseDashboardDto {
    private long todayTriageCount;
    private long pendingTriageCount;
    private long abnormalVitalsCount;
    private long occupiedBedsCount;
    private long totalBedsCount;
    private long activeAdmissionsCount;
    private long pendingMedicationsCount;
    private List<VitalSignsDto> recentAbnormalAlerts;
    private List<QueueManagementDto> activeQueue;
}
