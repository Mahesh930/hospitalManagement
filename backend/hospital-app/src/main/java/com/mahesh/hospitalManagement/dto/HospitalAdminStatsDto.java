package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalAdminStatsDto {
    private long todayOpdPatients;
    private long checkedInPatients;
    private long totalDoctors;
    private long totalPatients;
    private double totalRevenueToday;
    private long pendingBillsCount;
    private long occupiedBeds;
    private long totalBeds;
}
