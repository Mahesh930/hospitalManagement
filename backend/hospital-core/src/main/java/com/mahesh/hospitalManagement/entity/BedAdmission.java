package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing an Inpatient Bed Admission / Allocation.
 * Tracks patient admission, bed occupancy lifecycle, admitting doctor, and discharge status.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "bed_admissions",
        indexes = {
                @Index(name = "idx_admission_patient", columnList = "patient_id"),
                @Index(name = "idx_admission_bed", columnList = "bed_id"),
                @Index(name = "idx_admission_status", columnList = "status"),
                @Index(name = "idx_admission_doctor", columnList = "admitting_doctor_id")
        }
)
public class BedAdmission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admitting_doctor_id")
    private Doctor admittingDoctor;

    @Column(nullable = false)
    private LocalDateTime admissionTime;

    private LocalDateTime dischargeTime;

    @Column(length = 500)
    private String reasonForAdmission;

    @Column(nullable = false, length = 30)
    private String status; // ADMITTED, DISCHARGED, TRANSFERRED

    @Column(length = 1000)
    private String dischargeNotes;

    @Column(length = 100)
    private String admittedByNurse;
}
