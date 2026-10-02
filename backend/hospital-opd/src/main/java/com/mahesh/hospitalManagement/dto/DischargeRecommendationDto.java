package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DischargeRecommendationDto {

    @NotNull(message = "Bed admission ID is required")
    private UUID bedAdmissionId;

    @NotBlank(message = "Discharge recommendation summary is required")
    private String dischargeRecommendation;

    private String dischargeInstructions;
    private String conditionAtDischarge; // STABLE, IMPROVED, CRITICAL, REFERRED
    private String dietInstructions;
    private String activityInstructions;
}
