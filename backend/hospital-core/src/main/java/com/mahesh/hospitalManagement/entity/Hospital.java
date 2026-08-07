package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "hospital")
public class Hospital extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false, unique = true, length = 50)
    private String registrationNumber;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, TRIAL, READ_ONLY, SUSPENDED

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "details_id")
    private HospitalDetails details;

    @Builder.Default
    private Integer maxUsers = 25;

    @Builder.Default
    private Integer maxDoctors = 10;

    @Builder.Default
    private Integer maxBeds = 50;

    @Builder.Default
    private Boolean isSuspended = false;
}

