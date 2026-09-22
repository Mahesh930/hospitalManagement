package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Data Transfer Object representing a patient's complete longitudinal clinical timeline.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientTimelineDto {

    private UUID patientId;
    private String uhid;
    private String name;
    private Integer age;
    private String gender;
    private String bloodGroup;
    private String phone;
    private String existingDiseases;
    private String previousSurgeries;

    private List<PatientDto.AllergyDto> allergies;
    private List<TimelineEncounterDto> encounters;
    private List<TimelineVitalDto> recentVitals;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineEncounterDto {
        private UUID encounterId;
        private UUID appointmentId;
        private LocalDateTime encounterDate;
        private String visitType;
        private String doctorName;
        private String departmentName;
        private String icdCode;
        private String diagnosisNotes;
        private String advice;
        private String status;
        private String bloodPressure;
        private Double pulseRate;
        private Double temperature;
        private Double weight;
        private List<TimelinePrescriptionItemDto> prescriptionItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelinePrescriptionItemDto {
        private String medicineName;
        private String dosage;
        private String frequency;
        private Integer durationDays;
        private String instructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineVitalDto {
        private UUID id;
        private String bloodPressure;
        private Double pulseRate;
        private Double temperature;
        private Double weightKg;
        private Double spo2;
        private Boolean isAbnormal;
        private LocalDateTime recordedAt;
        private String recordedBy;
    }
}
