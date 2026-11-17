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
public class BedDto {
    private UUID id;
    private UUID wardId;
    private String wardName;
    private UUID hospitalId;
    private String bedNumber;
    private String status; // AVAILABLE, OCCUPIED, MAINTENANCE, CLEANING
    private Double dailyRate;
    private UUID currentPatientId;
    private String currentPatientName;
    private String currentPatientUhid;
    private UUID currentAdmissionId;
    private String admittedDoctorName;
}
