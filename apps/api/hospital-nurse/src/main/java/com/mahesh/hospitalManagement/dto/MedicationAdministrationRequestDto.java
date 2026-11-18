package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationAdministrationRequestDto {
    private UUID prescriptionItemId;
    private UUID patientId;
    private UUID bedAdmissionId;
    private String dosage;
    private String route;
    private String status; // GIVEN, HELD, REFUSED
    private String notes;
}
