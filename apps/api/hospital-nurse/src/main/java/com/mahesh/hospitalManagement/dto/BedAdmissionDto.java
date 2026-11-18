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
public class BedAdmissionDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID bedId;
    private String bedNumber;
    private String wardName;
    private UUID admittingDoctorId;
    private String doctorName;
    private LocalDateTime admissionTime;
    private LocalDateTime dischargeTime;
    private String reasonForAdmission;
    private String status;
    private String admittedByNurse;
    private String dischargeNotes;
}
