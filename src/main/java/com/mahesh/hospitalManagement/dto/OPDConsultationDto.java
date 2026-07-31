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

    // Diagnosis
    private String icdCode;
    private String diagnosisNotes;
    private String status;

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
        private Integer durationDays;
        private String instructions;
    }
}
