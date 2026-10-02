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
public class MedicineRecallDto {
    private UUID id;
    private String recallNumber;

    @NotNull(message = "Medicine ID is required")
    private UUID medicineId;
    private String medicineName;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    @NotBlank(message = "Recall reason is required")
    private String recallReason;

    private Integer quarantinedQuantity;
    private String status;
}
