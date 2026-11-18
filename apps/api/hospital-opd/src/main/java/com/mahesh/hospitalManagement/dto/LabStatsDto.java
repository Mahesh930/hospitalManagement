package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary metrics for the laboratory & diagnostics station.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabStatsDto {
    private Long totalTestsScheduledToday;
    private Long pendingSampleCollection;
    private Long samplesCollected;
    private Long inProgressTests;
    private Long completedToday;
    private Long abnormalResultsCount;
    private Long totalOverallTests;
}

