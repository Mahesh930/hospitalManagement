package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// import java.util.List;

/**
 * Consolidated 360-degree Patient Portal view payload for authenticated patients.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientPortalDto {
    private PatientDto patient;
    private PatientTimelineDto timeline;
    private Long totalAppointments;
    private Long activePrescriptionsCount;
    private Long totalInvestigationsCount;
    private Long pendingBillsCount;
    private Double outstandingBalance;
}
