package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "vital_signs",
        indexes = {
                @Index(name = "idx_vitals_patient", columnList = "patient_id"),
                @Index(name = "idx_vitals_appointment", columnList = "appointment_id")
        }
)
public class VitalSigns extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private Double heightCm;
    private Double weightKg;
    private Double bmi;

    @Column(length = 20)
    private String bloodPressure; // e.g. "120/80"

    private Double pulseRate; // bpm
    private Double temperature; // Fahrenheit or Celsius
    private Double respiratoryRate; // breaths/min
    private Double spo2; // % oxygen saturation

    private Double bloodSugarMgDl; // Random or fasting blood glucose
    private Integer painScore; // 0 - 10 Wong-Baker pain scale

    @Column(length = 20)
    private String triagePriority; // GREEN, YELLOW, RED

    @Column(length = 500)
    private String chiefComplaint;

    @Builder.Default
    private Boolean isAbnormal = false;

    @Column(length = 500)
    private String abnormalNotes;

    @Column(length = 100)
    private String recordedBy;

    private LocalDateTime recordedAt;
}
