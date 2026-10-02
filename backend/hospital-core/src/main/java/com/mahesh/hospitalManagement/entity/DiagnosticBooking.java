package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for front-desk lab, radiology, and diagnostic investigation appointments.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "diagnostic_bookings",
        indexes = {
                @Index(name = "idx_diag_patient", columnList = "patient_id"),
                @Index(name = "idx_diag_booking_time", columnList = "booking_date_time"),
                @Index(name = "idx_diag_status", columnList = "status")
        }
)
@SQLRestriction("deleted_at IS NULL")
public class DiagnosticBooking extends BaseEntity {

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "patient_name", length = 150)
    private String patientName;

    @Column(name = "patient_uhid", length = 50)
    private String patientUhid;

    @Column(name = "test_name", nullable = false, length = 150)
    private String testName;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String category = "LAB"; // LAB, RADIOLOGY, CARDIOLOGY, PATHOLOGY, OTHER

    @Column(name = "booking_date_time", nullable = false)
    private LocalDateTime bookingDateTime;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SCHEDULED"; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "referring_doctor_id")
    private UUID referringDoctorId;

    @Column(name = "referring_doctor_name", length = 100)
    private String referringDoctorName;

    @Column(name = "department_name", length = 100)
    private String departmentName;

    @Column(length = 500)
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String clinicalNotes;

    @Column(columnDefinition = "TEXT")
    private String resultNotes;

    @Column(name = "result_attachment_url", length = 255)
    private String resultAttachmentUrl;

    @Column(name = "result_recorded_at")
    private LocalDateTime resultRecordedAt;

    @Column(name = "is_abnormal")
    @Builder.Default
    private Boolean isAbnormal = false;

    @Column(name = "booked_by", length = 100)
    private String bookedBy;
}
