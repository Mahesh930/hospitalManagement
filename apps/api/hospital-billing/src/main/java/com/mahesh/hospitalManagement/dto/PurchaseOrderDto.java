package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderDto {
    private UUID id;
    private String poNumber;

    @NotBlank(message = "Supplier name is required")
    private String supplierName;

    private String supplierContact;

    @NotNull(message = "Order date is required")
    private LocalDate orderDate;

    private LocalDate expectedDeliveryDate;
    private LocalDate receivedDate;
    private String status; // ORDERED, RECEIVED, CANCELLED
    private Double totalAmount;
    private String itemsJson;
    private String notes;
}
