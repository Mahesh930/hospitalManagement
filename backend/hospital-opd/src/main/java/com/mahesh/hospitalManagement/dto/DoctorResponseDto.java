package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DoctorResponseDto {
    private UUID id;
    private String name;
    private String specialization;
    private String email;
    private String registrationNumber;
    private String roomNumber;
    private Double consultationFee;
    private Boolean isAvailable;
    private String phone;
    private String qualification;
    private Integer experienceYears;
    private String scheduleSummary;
}
