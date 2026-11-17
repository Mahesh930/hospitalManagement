package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyReportDto {
    private Long totalDispensedCount;
    private Double totalDispensedRevenue;
    private Long totalItemsDispensed;
    private Long expiredItemsCount;
    private Long lowStockItemsCount;
    private Long activeRecallsCount;
    private List<DailyDispenseSummary> dailyDispenses;
    private List<TopDispensedMedicine> topMedicines;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyDispenseSummary {
        private String date;
        private Long count;
        private Double revenue;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopDispensedMedicine {
        private String medicineName;
        private Integer quantityDispensed;
        private Double totalValue;
    }
}
