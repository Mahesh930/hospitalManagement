package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispenseResponseDto {
    private UUID id;
    private String dispenseNumber;
    private UUID prescriptionId;
    private UUID patientId;
    private String patientName;
    private String uhid;
    private String pharmacistUsername;
    private LocalDateTime dispenseDate;
    private Double totalAmount;
    private String paymentStatus;
    private String status;
    private String handoverTo;
    private String instructions;
    private UUID invoiceId;
    private List<DispensedItemDto> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DispensedItemDto {
        private UUID id;
        private UUID medicineId;
        private String medicineName;
        private String batchNumber;
        private Integer quantityDispensed;
        private Double unitPrice;
        private Double totalPrice;
        private String dosageInstructions;
    }
}
