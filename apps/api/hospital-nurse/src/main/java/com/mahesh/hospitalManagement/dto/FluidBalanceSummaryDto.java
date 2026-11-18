package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FluidBalanceSummaryDto {
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private Double totalIntakeMl;
    private Double totalOutputMl;
    private Double netBalanceMl;
    private Boolean isFluidOverloadRisk;
    private List<FluidBalanceDto> recentRecords;
}
