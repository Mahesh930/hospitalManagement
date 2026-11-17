package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OPDConsultationDto {
    private UUID id;
    private UUID appointmentId;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID doctorId;
    private String doctorName;

    // Vitals
    private String bloodPressure;
    private Double pulseRate;
    private Double temperature;
    private Double weight;
    private Double spo2;
    private Double respiratoryRate;

    // Clinical Assessment
    private String chiefComplaint;
    private String historyOfPresentIllness;
    private String pastMedicalHistory;
    private String surgicalHistory;
    private String familyHistory;
    private String socialHistory;
    private String physicalExamination;
    private String clinicalNotes;

    // Diagnosis
    private String icdCode; // Primary ICD-10
    private String diagnosisNotes; // Primary Diagnosis description
    private String secondaryDiagnoses;
    private String differentialDiagnosis;

    // Care & Treatment Plan
    private String treatmentPlan;
    private String patientInstructions;
    private String dietInstructions;
    private String activityInstructions;

    // Referral & Follow-up
    private String referralDepartment;
    private String referralDoctor;
    private String referralNotes;
    private LocalDate followUpDate;
    private String followUpInstructions;

    private String status; // IN_PROGRESS, COMPLETED

    // Amendment tracking
    private Boolean amended;
    private String amendmentReason;
    private Instant amendedAt;
    private String amendedBy;

    private PrescriptionDto prescription;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionDto {
        private UUID id;
        private String advice;
        private List<PrescriptionItemDto> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionItemDto {
        private UUID id;
        private String medicineName;
        private String dosage;
        private String frequency;
        private String route;
        private Integer durationDays;
        private Integer quantity;
        private String instructions;
    }
}
