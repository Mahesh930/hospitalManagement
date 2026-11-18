package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceDetailsDto {

    private UUID id;
    private UUID patientId;
    private String policyNumber;
    private String provider;
    private String policyName;
    private LocalDate validTill;
    private String tpaName;
    private String preAuthStatus; // NONE, REQUESTED, APPROVED, REJECTED
    private Double coverageAmount;
    private String remarks;
}
