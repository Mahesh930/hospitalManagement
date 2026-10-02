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
    private Double spo2;
    private Double respiratoryRate;

    // Clinical Assessment
    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String historyOfPresentIllness;

    @Column(columnDefinition = "TEXT")
    private String pastMedicalHistory;

    @Column(columnDefinition = "TEXT")
    private String surgicalHistory;

    @Column(columnDefinition = "TEXT")
    private String familyHistory;

    @Column(columnDefinition = "TEXT")
    private String socialHistory;

    @Column(columnDefinition = "TEXT")
    private String physicalExamination;

    @Column(columnDefinition = "TEXT")
    private String clinicalNotes;

    // Diagnosis
    @Column(length = 20)
    private String icdCode; // Primary ICD-10

    @Column(columnDefinition = "TEXT")
    private String diagnosisNotes; // Primary diagnosis description

    @Column(columnDefinition = "TEXT")
    private String secondaryDiagnoses; // Additional ICD codes/descriptions

    @Column(columnDefinition = "TEXT")
    private String differentialDiagnosis;

    // Care & Treatment Plan
    @Column(columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(columnDefinition = "TEXT")
    private String patientInstructions;

    @Column(columnDefinition = "TEXT")
    private String dietInstructions;

    @Column(columnDefinition = "TEXT")
    private String activityInstructions;

    // Referral & Follow-up
    @Column(length = 100)
    private String referralDepartment;

    @Column(length = 100)
    private String referralDoctor;

    @Column(columnDefinition = "TEXT")
    private String referralNotes;

    private java.time.LocalDate followUpDate;

    @Column(columnDefinition = "TEXT")
    private String followUpInstructions;

    @Column(nullable = false, length = 30)
    private String status; // IN_PROGRESS, COMPLETED

    // Amendment tracking for finalized consultation protection
    @Builder.Default
    private Boolean amended = false;

    @Column(columnDefinition = "TEXT")
    private String amendmentReason;

    private java.time.Instant amendedAt;

    @Column(length = 100)
    private String amendedBy;

    @OneToOne(mappedBy = "consultation", cascade = CascadeType.ALL)
    private Prescription prescription;
}
