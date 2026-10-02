package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalSafetyCheckDto {
    private UUID patientId;
    private List<String> medications;

    // Response evaluation fields
    private Boolean isBlocked;
    private List<String> allergyConflicts;
    private List<String> drugInteractions;
    private List<String> warnings;
}
