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
public class BedAdmissionRequestDto {
    private UUID patientId;
    private UUID bedId;
    private UUID admittingDoctorId;
    private String reasonForAdmission;
}
