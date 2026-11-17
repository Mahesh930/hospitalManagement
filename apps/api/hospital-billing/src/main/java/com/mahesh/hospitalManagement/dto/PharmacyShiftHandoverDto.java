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
public class PharmacyShiftHandoverDto {
    private UUID id;

    @NotBlank(message = "Shift name is required (Morning, Evening, Night)")
    private String shiftName;

    @NotNull(message = "Handover date is required")
    private LocalDate handoverDate;

    private String outgoingPharmacist;
    private String incomingPharmacist;
    private Integer pendingPrescriptionsCount;
    private Integer lowStockItemsCount;
    private String criticalAlerts;
    private String notes;
    private String status;
}
