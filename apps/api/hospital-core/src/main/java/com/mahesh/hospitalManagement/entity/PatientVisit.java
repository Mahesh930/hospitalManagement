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
        name = "patient_visit",
        indexes = {
                @Index(name = "idx_visit_patient", columnList = "patient_id"),
                @Index(name = "idx_visit_doctor_date", columnList = "doctor_id, checkInTime")
        }
)
public class PatientVisit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(nullable = false, length = 30)
    private String visitType; // NEW_VISIT, FOLLOW_UP, EMERGENCY, WALK_IN, TELECONSULTATION

    @Column(nullable = false)
    private Integer priorityRank; // 0=Emergency, 1=VIP/Follow-up, 2=Standard

    @Column(nullable = false, length = 30)
    private String tokenNumber; // e.g. T-101

    @Column(nullable = false, length = 30)
    private String status; // REGISTERED, CHECKED_IN, IN_VITALS, WAITING_DOCTOR, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW

    private LocalDateTime checkInTime;
    private LocalDateTime consultationStartTime;
    private LocalDateTime consultationEndTime;

    @Column(length = 500)
    private String notes;
}
