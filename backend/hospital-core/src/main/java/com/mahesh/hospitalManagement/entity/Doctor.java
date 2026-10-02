package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "doctor")
public class Doctor extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String specialization;

    @Column(length = 50)
    private String registrationNumber;

    @Column(length = 100)
    private String qualification;

    @Column(length = 20)
    private String phone;

    private Integer experienceYears;

    @Column(length = 255)
    private String scheduleSummary; // e.g. "Mon-Fri: 09:00 - 17:00, Sat: 09:00 - 13:00"

    @Column(nullable = false)
    private Double consultationFee;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 50)
    private String roomNumber;

    @Builder.Default
    private Boolean isAvailable = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @ManyToMany(mappedBy = "doctors")
    @Builder.Default
    private Set<Department> departments = new HashSet<>();

    @OneToMany(mappedBy = "doctor")
    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();
}
