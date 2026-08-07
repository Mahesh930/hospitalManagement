package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "patient_document",
        indexes = {
                @Index(name = "idx_doc_patient", columnList = "patient_id")
        }
)
public class PatientDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 50)
    private String docType; // AADHAAR, INSURANCE_CARD, REFERRAL_LETTER, PREVIOUS_REPORT, PRESCRIPTION, CONSENT_FORM

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(nullable = false, length = 500)
    private String fileUri;

    @Column(length = 50)
    private String mimeType;

    private Long sizeBytes;

    @Column(length = 100)
    private String uploadedBy;
}
