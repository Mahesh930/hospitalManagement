package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyDashboardDto {
    private Long pendingPrescriptionsCount;
    private Long verifiedPrescriptionsCount;
    private Long dispensedTodayCount;
    private Double todayDispensedValue;
    private Long lowStockBatchesCount;
    private Long nearExpiryBatchesCount;
    private Long activeRecallsCount;

    private List<PrescriptionQueueItemDto> activeQueue;
    private List<MedicineBatchDto> lowStockAlerts;
    private List<MedicineBatchDto> nearExpiryAlerts;
}
