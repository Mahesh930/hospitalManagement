package com.mahesh.hospitalManagement.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class OnboardDoctorRequestDto {
    private UUID userId;
    private String specialization;
    private String name;
    private String registrationNumber;
    private Double consultationFee;
    private String email;
}
