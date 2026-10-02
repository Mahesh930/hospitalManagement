package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateCheckDto {

    private boolean isDuplicate;
    private int matchCount;
    private List<MatchedPatientDto> matchedPatients;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchedPatientDto {
        private UUID id;
        private String uhid;
        private String name;
        private String phone;
        private String email;
        private String aadhaar;
        private String gender;
        private Integer age;
        private String matchReason;
    }
}
