package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCertificateDto {
    private UUID id;
    private String certificateNumber;

    /**
     * FITNESS, MEDICAL_LEAVE, SICKNESS, DISABILITY, TRAVEL_FITNESS, FIT_TO_WORK
     */
    @NotBlank(message = "Certificate type is required")
    private String certificateType;

    @NotNull(message = "Patient ID is required")
    private UUID patientId;
    private String patientName;
    private String patientUhid;

    private UUID doctorId;
    private String doctorName;

    private LocalDate issueDate;
    private LocalDate startDate;
    private LocalDate endDate;

    private String diagnosis;
    private String clinicalRemarks;
    private String recommendations;
    private String status;
}
