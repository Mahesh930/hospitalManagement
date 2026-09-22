package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDto {
    private UUID id;
    private String uhid;
    private String abhaId;
    private String name;
    private String middleName;
    private String lastName;
    private LocalDate birthDate;
    private Integer age;
    private String phone;
    private String altPhone;
    private String email;
    private String gender;
    private String bloodGroup;
    private String maritalStatus;
    private String occupation;
    private String aadhaar;
    private String pan;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String emergencyContactName;
    private String emergencyContactRelation;
    private String emergencyContactPhone;
    private String existingDiseases;
    private String previousSurgeries;
    private String disabilityStatus;
    private Boolean pregnancyStatus;
    private Boolean corporatePatient;
    private String tpaDetails;
    private String qrCodeData;
    private Boolean isEmergency;
    private UUID hospitalId;
    private String hospitalName;
    private List<AllergyDto> allergies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllergyDto {
        private UUID id;
        private String allergen;
        private String severity;
        private String reaction;
    }
}
