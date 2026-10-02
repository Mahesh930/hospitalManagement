package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotNull;
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
public class InpatientProgressNoteDto {
    private UUID id;

    @NotNull(message = "Bed admission ID is required")
    private UUID bedAdmissionId;

    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private String bedNumber;
    private String wardName;

    private UUID doctorId;
    private String doctorName;

    private String noteType; // WARD_ROUND, SOAP_NOTE, EMERGENCY_REVIEW
    private LocalDateTime roundDateTime;

    // SOAP Format
    private String subjective;
    private String objective;
    private String assessment;
    private String plan;

    // Vitals
    private String bloodPressure;
    private Double pulseRate;
    private Double temperature;
    private Double spo2;
    private Double respiratoryRate;

    private Boolean isCritical;
    private String clinicalInstructions;
}
