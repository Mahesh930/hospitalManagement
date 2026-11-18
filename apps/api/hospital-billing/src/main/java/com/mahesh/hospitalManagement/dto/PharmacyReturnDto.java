package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyReturnDto {
    private UUID id;
    private String returnNumber;
    private UUID patientId;
    private String patientName;
    private UUID dispenseRecordId;

    @NotNull(message = "Medicine ID is required")
    private UUID medicineId;
    private String medicineName;

    @NotNull(message = "Batch ID is required")
    private UUID batchId;
    private String batchNumber;

    @NotNull(message = "Return quantity is required")
    @Min(value = 1, message = "Return quantity must be at least 1")
    private Integer returnQuantity;

    private Double refundAmount;

    @NotBlank(message = "Disposition is required (RETURN_TO_STOCK, QUARANTINE_WASTE, DAMAGED)")
    private String disposition; // RETURN_TO_STOCK, QUARANTINE_WASTE, DAMAGED

    @NotBlank(message = "Reason is required")
    private String reason;

    private String status;
}
