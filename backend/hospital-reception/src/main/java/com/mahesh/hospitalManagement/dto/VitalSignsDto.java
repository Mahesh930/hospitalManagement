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
public class VitalSignsDto {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientUhid;
    private UUID appointmentId;
    private Double heightCm;
    private Double weightKg;
    private Double bmi;
    private String bloodPressure;
    private Double pulseRate;
    private Double temperature;
    private Double respiratoryRate;
    private Double spo2;
    private Boolean isAbnormal;
    private String abnormalNotes;
    private String recordedBy;
    private LocalDateTime recordedAt;
}
