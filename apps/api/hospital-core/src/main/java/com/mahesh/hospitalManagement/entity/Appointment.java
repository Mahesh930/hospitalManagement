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
    private String status; // BOOKED, CONFIRMED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW

    private Integer queueOrder;

    @Column(name = "token_number", length = 30)
    private String tokenNumber;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "confirmed_by", length = 100)
    private String confirmedBy;

    @Column(name = "reminder_sent_at")
    private LocalDateTime reminderSentAt;

    @Column(name = "referral_source", length = 150)
    private String referralSource;

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
