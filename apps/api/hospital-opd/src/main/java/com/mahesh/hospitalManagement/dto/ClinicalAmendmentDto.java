package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalAmendmentDto {

    @NotBlank(message = "Amendment clinical rationale is mandatory")
    private String amendmentReason;

    private String updatedClinicalNotes;
    private String updatedDiagnosisNotes;
    private String updatedTreatmentPlan;
    private String updatedPatientInstructions;
    private String updatedDietInstructions;
    private String updatedActivityInstructions;
}
