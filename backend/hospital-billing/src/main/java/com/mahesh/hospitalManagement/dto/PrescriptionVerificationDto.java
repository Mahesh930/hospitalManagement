package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionVerificationDto {
    @NotNull(message = "Prescription ID is required")
    private UUID prescriptionId;

    @NotNull(message = "Action is required (VERIFY, REJECT, CLARIFY)")
    private String action; // VERIFY, REJECT, CLARIFY

    private String notes;
}
