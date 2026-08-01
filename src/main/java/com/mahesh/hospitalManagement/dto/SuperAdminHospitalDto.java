package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminHospitalDto {
    private UUID id;
    private String name;
    private String address;
    private String registrationNumber;
    private String status;
    private Boolean isSuspended;
    private Integer maxUsers;
    private Integer maxDoctors;
    private Integer maxBeds;

    // Extended Details
    private String gstNumber;
    private String licenseNumber;
    private String category;
    private String ownershipType;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String email;
    private String phone;
    private String emergencyNumber;
    private String website;
}
