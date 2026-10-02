package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * Entity tracking formal requests to merge duplicate patient records.
 * Complies with hospital identity governance and audit logging standards.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "patient_merge_requests",
        indexes = {
                @Index(name = "idx_merge_source_patient", columnList = "source_patient_id"),
                @Index(name = "idx_merge_target_patient", columnList = "target_patient_id"),
                @Index(name = "idx_merge_status", columnList = "status")
        }
)
@SQLRestriction("deleted_at IS NULL")
public class PatientMergeRequest extends BaseEntity {

    @Column(name = "source_patient_id", nullable = false)
    private UUID sourcePatientId;

    @Column(name = "source_patient_uhid", length = 50)
    private String sourcePatientUhid;

    @Column(name = "source_patient_name", length = 150)
    private String sourcePatientName;

    @Column(name = "target_patient_id", nullable = false)
    private UUID targetPatientId;

    @Column(name = "target_patient_uhid", length = 50)
    private String targetPatientUhid;

    @Column(name = "target_patient_name", length = 150)
    private String targetPatientName;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "requested_by", length = 100)
    private String requestedBy;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "review_notes", length = 1000)
    private String reviewNotes;
}
