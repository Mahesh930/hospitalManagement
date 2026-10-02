package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientClinicalSummaryDto {
    private UUID patientId;
    private String uhid;
    private String name;
    private Integer age;
    private String gender;
    private String bloodGroup;
    private String contactNumber;

    private List<AllergySummaryDto> allergies;
    private VitalSignsSummaryDto latestVitals;
    private List<VitalSignsSummaryDto> vitalHistory;
    private List<ConsultationBriefDto> pastConsultations;
    private List<PrescriptionBriefDto> activePrescriptions;
    private List<InvestigationBriefDto> recentInvestigations;
    private String activeBedNumber;
    private String activeWardName;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllergySummaryDto {
        private String allergen;
        private String severity;
        private String reaction;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VitalSignsSummaryDto {
        private String bloodPressure;
        private Double pulseRate;
        private Double temperature;
        private Double spo2;
        private Double respiratoryRate;
        private Double weightKg;
        private LocalDateTime recordedAt;
        private Boolean isAbnormal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsultationBriefDto {
        private UUID consultationId;
        private LocalDateTime consultationDate;
        private String doctorName;
        private String icdCode;
        private String diagnosisNotes;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionBriefDto {
        private UUID prescriptionId;
        private LocalDateTime prescribedDate;
        private String doctorName;
        private List<String> medications;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvestigationBriefDto {
        private UUID bookingId;
        private String testName;
        private String category;
        private LocalDateTime bookingDate;
        private String status;
        private Boolean isAbnormal;
        private String resultNotes;
    }
}
