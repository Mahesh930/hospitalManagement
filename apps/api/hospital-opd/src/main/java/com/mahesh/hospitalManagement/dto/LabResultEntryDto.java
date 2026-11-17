package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for recording diagnostic / laboratory test findings and analytical results.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabResultEntryDto {
    @NotBlank(message = "Result notes or analytical findings are required")
    private String resultNotes;

    private String resultAttachmentUrl;

    private Boolean isAbnormal;

    private String referenceRange;

    private String technicianNotes;
}

