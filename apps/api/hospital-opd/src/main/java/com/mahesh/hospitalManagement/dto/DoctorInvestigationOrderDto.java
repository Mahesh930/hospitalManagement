package com.mahesh.hospitalManagement.dto;

import jakarta.validation.constraints.NotBlank;
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
public class DoctorInvestigationOrderDto {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    @NotBlank(message = "Test name is required")
    private String testName;

    /**
     * LAB, RADIOLOGY, PATHOLOGY, CARDIOLOGY, OTHER
     */
    @NotBlank(message = "Category is required")
    private String category;

    private String clinicalNotes;
    private String instructions;
    private String departmentName;
    private LocalDateTime bookingDateTime;
}
