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

    @Column(length = 50)
    private String middleName;

    @Column(length = 50)
    private String lastName;

    private LocalDate birthDate;

    private Integer age;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 20)
    private String altPhone;

    @Column(length = 100)
    private String email;

    @Column(length = 10)
    private String gender;

    @Column(length = 20)
    private String maritalStatus;

    @Column(length = 50)
    private String occupation;

    @Column(length = 20)
    private String aadhaar;

    @Column(length = 20)
    private String pan;

    @Column(length = 255)
    private String address;

    @Column(length = 50)
    private String city;

    @Column(length = 50)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(length = 100)
    private String emergencyContactName;

    @Column(length = 50)
    private String emergencyContactRelation;

    @Column(length = 20)
    private String emergencyContactPhone;

    @Column(columnDefinition = "TEXT")
    private String existingDiseases;

    @Column(columnDefinition = "TEXT")
    private String previousSurgeries;

    @Column(length = 50)
    private String disabilityStatus;

    private Boolean pregnancyStatus;

    private Boolean corporatePatient;

    @Column(length = 100)
    private String tpaDetails;

    @Column(length = 500)
    private String qrCodeData;

    @Builder.Default
    private Boolean isEmergency = false;

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