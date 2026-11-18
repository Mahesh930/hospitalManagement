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
public class AdmissionRecommendationDto {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    @NotBlank(message = "Reason for admission is required")
    private String reasonForAdmission;

    private String suggestedDepartment;
    private String suggestedWardType;
    private String priority; // ROUTINE, URGENT, EMERGENCY
    private String clinicalNotes;
}
