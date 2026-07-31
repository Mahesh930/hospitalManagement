package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "patient_allergy")
public class PatientAllergy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 100)
    private String allergen; // e.g. Penicillin, Aspirin, Peanuts

    @Column(length = 50)
    private String severity; // SEVERE, MODERATE, MILD

    @Column(length = 255)
    private String reaction;
}
