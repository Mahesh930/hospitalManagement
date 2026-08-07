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
public class WalkinTokenRequestDto {
    private UUID patientId;
    private UUID doctorId;
    private UUID departmentId;
    private String visitType; // WALK_IN, FOLLOW_UP, EMERGENCY, CORPORATE
    private Boolean isEmergency;
    private Boolean isVip;
    private String notes;
}
