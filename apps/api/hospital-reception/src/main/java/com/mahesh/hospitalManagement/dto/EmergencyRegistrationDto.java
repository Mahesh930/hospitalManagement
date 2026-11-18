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
public class EmergencyRegistrationDto {
    private String name; // e.g. "Unidentified Male #1" or actual name
    private String gender;
    private Integer age;
    private String phone;
    private UUID doctorId;
    private UUID departmentId;
    private String notes;
}
