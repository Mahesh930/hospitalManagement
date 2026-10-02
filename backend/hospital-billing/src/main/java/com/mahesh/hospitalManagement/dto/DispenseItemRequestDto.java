package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispenseItemRequestDto {

    private UUID prescriptionItemId;

    @NotNull(message = "Medicine ID is required")
    private UUID medicineId;

    @NotNull(message = "Batch ID is required")
    private UUID batchId;

    @NotNull(message = "Quantity dispensed must be specified")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantityDispensed;

    private Double unitPrice;

    private String dosageInstructions;
}
