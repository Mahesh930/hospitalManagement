package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "hospital_details")
public class HospitalDetails extends BaseEntity {

    private String gstNumber;

    private String licenseNumber;

    private String category; // GOVT, PRIVATE, TRUST

    private String ownershipType;

    private String country;

    private String state;

    private String district;

    private String city;

    private String postalCode;

    private String email;

    private String phone;

    private String emergencyNumber;

    private String website;

    private String logoUrl;

    private String themeColor;

    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private String financialYearStart = "04-01";
}
