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
public class InvoiceDto {
    private UUID id;
    private String invoiceNumber;
    private String idempotencyKey;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID consultationId;
    private Double subtotal;
    private Double discountAmount;
    private String discountReason;
    private String discountApprovedBy;
    private Double gstAmount;
    private Double grandTotal;
    private String paymentStatus;
    private String paymentMethod;
    private List<InvoiceItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceItemDto {
        private UUID id;
        private String description;
        private Integer quantity;
        private Double unitPrice;
        private Double gstPercentage;
        private Double totalPrice;
    }
}
