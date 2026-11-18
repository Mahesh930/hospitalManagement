package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.Min;
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
public class StockReceiptDto {

    @NotNull(message = "Medicine ID is required")
    private UUID medicineId;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    private LocalDate mfgDate;

    @NotNull(message = "Quantity received must be provided")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private Double purchasePrice;

    private Double mrp;

    private Double sellingPrice;

    private String storageLocation;

    private String supplierName;

    private String invoiceNumber;

    private String notes;
}
