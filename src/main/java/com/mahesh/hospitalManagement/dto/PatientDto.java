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
    private LocalDate birthDate;
    private Integer age;
    private String phone;
    private String email;
    private String gender;
    private String bloodGroup;
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
