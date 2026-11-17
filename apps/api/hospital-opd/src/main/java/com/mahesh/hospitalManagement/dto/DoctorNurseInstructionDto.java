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
public class DoctorNurseInstructionDto {
    private UUID id;

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    private UUID bedAdmissionId;
    private UUID wardId;

    @NotBlank(message = "Order title is required")
    private String taskTitle;

    private String description;

    /**
     * ROUTINE, URGENT, STAT
     */
    @Builder.Default
    private String priority = "ROUTINE";

    private LocalDateTime scheduledAt;
    private LocalDateTime dueAt;
}
