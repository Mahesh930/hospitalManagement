package com.mahesh.hospitalManagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispenseRequestDto {

    private UUID prescriptionId;

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    private String handoverTo; // Self, Relative, Ward Nurse

    private String instructions;

    private String paymentStatus; // PAID, PENDING_BILLING, EXEMPT

    private Boolean createBillingInvoice; // Automatically link/create billing charges

    @NotEmpty(message = "At least one medicine must be dispensed")
    @Valid
    private List<DispenseItemRequestDto> items;
}
