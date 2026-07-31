package com.mahesh.hospitalManagement.entity;

import com.mahesh.hospitalManagement.entity.type.BloodGroupType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@ToString
@Getter
@Setter
@Table(
        name = "patient",
        indexes = {
                @Index(name = "idx_patient_phone", columnList = "phone"),
                @Index(name = "idx_patient_uhid", columnList = "uhid")
        }
)
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Patient extends BaseEntity {

    @Column(nullable = false, unique = true, length = 30)
    private String uhid;

    @Column(unique = true, length = 50)
    private String abhaId;

    @Column(nullable = false, length = 100)
    private String name;

    private LocalDate birthDate;

    private Integer age;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 10)
    private String gender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private BloodGroupType bloodGroup;

    @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JoinColumn(name = "patient_insurance_id")
    private Insurance insurance;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private List<PatientAllergy> allergies = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();
}