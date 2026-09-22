package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing an Electronic Medication Administration Record (eMAR).
 * Logs each dose administered, held, or refused by the nursing staff,
 * linked to the doctor's prescription item and admitted patient.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "medication_administrations",
        indexes = {
                @Index(name = "idx_emar_patient", columnList = "patient_id"),
                @Index(name = "idx_emar_prescription_item", columnList = "prescription_item_id"),
                @Index(name = "idx_emar_administered_at", columnList = "administeredAt")
        }
)
public class MedicationAdministration extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_item_id", nullable = false)
    private PrescriptionItem prescriptionItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    private LocalDateTime scheduledTime;

    @Column(nullable = false)
    private LocalDateTime administeredAt;

    @Column(nullable = false, length = 100)
    private String administeredBy; // Nurse name or username

    @Column(length = 100)
    private String dosage; // e.g. "500mg", "10ml"

    @Column(nullable = false, length = 50)
    private String route; // ORAL, IV_BOLUS, IV_INFUSION, IM, SUBCUTANEOUS, TOPICAL, INHALATION

    @Column(nullable = false, length = 30)
    private String status; // GIVEN, HELD, REFUSED

    @Column(length = 500)
    private String notes; // Clinical observations or reasons for hold/refusal
}
