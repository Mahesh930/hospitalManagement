package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentDto {

    @NotNull(message = "Batch ID is required")
    private UUID batchId;

    @NotNull(message = "Quantity change is required (+ for addition, - for reduction)")
    private Integer quantityChange;

    @NotBlank(message = "Adjustment reason is required")
    private String reason; // DAMAGE, EXPIRED, PHYSICAL_COUNT_VARIANCE, QUARANTINE, WRITE_OFF, CORRECTION

    private String notes;
}
