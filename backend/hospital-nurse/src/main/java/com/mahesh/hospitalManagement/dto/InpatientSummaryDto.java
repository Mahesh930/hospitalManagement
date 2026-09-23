package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InpatientSummaryDto {
    private UUID patientId;
    private String name;
    private String uhid;
    private String gender;
    private String bloodGroup;
    private Integer age;
    private UUID bedAdmissionId;
    private String currentWardName;
    private String currentBedNumber;
    private String admissionStatus;
    private String admittingDoctorName;
    private String reasonForAdmission;
    private List<String> allergies;
    private VitalSignsDto latestVitals;
    private FluidBalanceSummaryDto fluidBalanceSummary;
    private List<MedicationAdministrationDto> pendingMedications;
    private List<NursingTaskDto> activeTasks;
    private List<NursingAssessmentDto> latestRiskAssessments;
    private List<ClinicalEscalationDto> activeEscalations;
    private List<NursingNoteDto> recentNotes;
}
