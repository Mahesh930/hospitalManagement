package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * Entity for patient complaints, service requests, and feedback registered at reception.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "patient_feedbacks",
        indexes = {
                @Index(name = "idx_feedback_patient", columnList = "patient_id"),
                @Index(name = "idx_feedback_category", columnList = "category"),
                @Index(name = "idx_feedback_status", columnList = "status")
        }
)
@SQLRestriction("deleted_at IS NULL")
public class PatientFeedback extends BaseEntity {

    @Column(name = "patient_id")
    private UUID patientId;

    @Column(name = "patient_name", length = 150)
    private String patientName;

    @Column(name = "patient_uhid", length = 50)
    private String patientUhid;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String category = "COMPLAINT"; // COMPLAINT, SERVICE_REQUEST, SUGGESTION, COMPLIMENT

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String severity = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    @Column(name = "recorded_by", length = 100)
    private String recordedBy;

    @Column(name = "assigned_department", length = 100)
    private String assignedDepartment;

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;
}
