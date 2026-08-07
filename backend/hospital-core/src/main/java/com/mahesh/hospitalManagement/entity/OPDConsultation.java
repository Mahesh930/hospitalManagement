package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "opd_consultation")
public class OPDConsultation extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    // Vitals
    private String bloodPressure;
    private Double pulseRate;
    private Double temperature;
    private Double weight;

    // Diagnosis
    @Column(length = 20)
    private String icdCode;

    @Column(columnDefinition = "TEXT")
    private String diagnosisNotes;

    @Column(nullable = false, length = 30)
    private String status; // IN_PROGRESS, COMPLETED

    @OneToOne(mappedBy = "consultation", cascade = CascadeType.ALL)
    private Prescription prescription;
}
