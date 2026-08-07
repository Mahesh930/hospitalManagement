package com.mahesh.hospitalManagement.dto;

import com.mahesh.hospitalManagement.entity.type.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDto {
    private String jwt;
    private UUID userId;
    private String username;
    private Set<RoleType> roles;
}

