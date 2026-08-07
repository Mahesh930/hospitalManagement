package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyReceptionistReportDto {
    private LocalDate reportDate;
    private long newRegistrations;
    private long walkinCount;
    private long totalAppointments;
    private long checkedInCount;
    private long noShowCount;
    private long completedCount;
    private double estimatedRevenue;
    private List<QueueManagementDto> recentVisits;
}
