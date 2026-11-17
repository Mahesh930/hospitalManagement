package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object encapsulating real-time financial and cashier statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingStatsDto {
    private Double todayRevenue;
    private Double cashCollected;
    private Double cardCollected;
    private Double upiCollected;
    private Double insuranceCollected;
    private Long pendingInvoicesCount;
    private Double pendingAmount;
    private Long paidInvoicesCount;
    private Long refundedInvoicesCount;
    private Long totalInvoicesCount;
}

