package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

/**
 * Entity representing an official Medical Certificate issued by an authorized doctor.
 * Supports fitness certificates, sickness leave, disability, and travel fitness.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "medical_certificates",
        indexes = {
                @Index(name = "idx_med_cert_patient", columnList = "patient_id"),
                @Index(name = "idx_med_cert_doctor", columnList = "doctor_id"),
                @Index(name = "idx_med_cert_number", columnList = "certificate_number", unique = true)
        }
)
@SQLRestriction("deleted_at IS NULL")
public class MedicalCertificate extends BaseEntity {

    @Column(name = "certificate_number", nullable = false, unique = true, length = 50)
    private String certificateNumber;

    /**
     * FITNESS, MEDICAL_LEAVE, SICKNESS, DISABILITY, TRAVEL_FITNESS, FIT_TO_WORK
     */
    @Column(name = "certificate_type", nullable = false, length = 50)
    private String certificateType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 255)
    private String diagnosis;

    @Column(name = "clinical_remarks", columnDefinition = "TEXT")
    private String clinicalRemarks;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    /**
     * ACTIVE, REVOKED, EXPIRED
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";
}
