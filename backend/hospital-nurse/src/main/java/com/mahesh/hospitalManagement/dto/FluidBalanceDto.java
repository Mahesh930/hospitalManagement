package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FluidBalanceDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID bedAdmissionId;
    private String recordType; // INTAKE, OUTPUT
    private String subCategory; // ORAL, IV_FLUID, TUBE_FEED, BLOOD_PRODUCT, URINE, SURGICAL_DRAIN, VOMIT, NG_ASPIRATE, OTHER
    private Double amountMl;
    private LocalDateTime recordedAt;
    private String recordedBy;
    private String notes;
}
