package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "prescription")
public class Prescription extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "consultation_id", nullable = false)
    private OPDConsultation consultation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(columnDefinition = "TEXT")
    private String advice;

    @Column(length = 50)
    @Builder.Default
    private String status = "SUBMITTED"; // SUBMITTED, VERIFIED, PARTIALLY_DISPENSED, DISPENSED, REJECTED, CANCELLED

    @Column(length = 255)
    private String verificationNotes;

    @Column(length = 100)
    private String verifiedBy;

    @Column(length = 255)
    private String rejectionReason;

    @Builder.Default
    private Boolean clarificationRequested = false;

    @Column(columnDefinition = "TEXT")
    private String clarificationNotes;

    private java.time.LocalDateTime dispensedAt;

    @Column(length = 100)
    private String dispensedBy;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<PrescriptionItem> items = new ArrayList<>();
}
