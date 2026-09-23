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
public class MedicationAdministrationDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private UUID prescriptionItemId;
    private String medicineName;
    private String dosage;
    private String route;
    private String status; // GIVEN, HELD, REFUSED
    private String administeredBy;
    private LocalDateTime administeredAt;
    private String notes;
}
