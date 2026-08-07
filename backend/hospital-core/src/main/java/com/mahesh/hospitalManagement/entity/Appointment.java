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
@ToString
@Table(
        name = "appointment",
        indexes = {
                @Index(name = "idx_appointment_doctor_time", columnList = "doctor_id, appointmentTime")
        }
)
public class Appointment extends BaseEntity {

    @Column(nullable = false)
    private LocalDateTime appointmentTime;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false, length = 30)
    private String status; // BOOKED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED

    private Integer queueOrder;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @ToString.Exclude
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @ToString.Exclude
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;
}
