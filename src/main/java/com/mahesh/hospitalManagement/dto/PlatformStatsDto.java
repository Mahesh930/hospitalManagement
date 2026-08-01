package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsDto {
    private long totalHospitals;
    private long activeHospitals;
    private long suspendedHospitals;
    private long trialHospitals;
    private long totalUsers;
    private long totalDoctors;
    private long totalPatients;
}
