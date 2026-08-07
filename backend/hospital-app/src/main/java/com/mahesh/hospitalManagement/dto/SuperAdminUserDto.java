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
public class SuperAdminUserDto {
    private UUID id;
    private String username;
    private String phone;
    private String roles;
    private String providerType;
    private boolean locked;
    private String hospitalName;
    private UUID hospitalId;
}
