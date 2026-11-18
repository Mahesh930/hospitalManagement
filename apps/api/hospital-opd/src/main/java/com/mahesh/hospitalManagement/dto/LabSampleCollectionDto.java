package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Payload for logging specimen / sample collection by the laboratory technician.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabSampleCollectionDto {
    @NotBlank(message = "Sample barcode or tube identifier is required")
    private String barcode;

    @NotBlank(message = "Specimen type (e.g. Whole Blood, Serum, Urine, Swab) is required")
    private String specimenType;

    private LocalDateTime collectionTime;

    private String technicianNotes;
}

