package com.mahesh.hospitalManagement.dto;

import com.mahesh.hospitalManagement.entity.type.RoleType;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignUpRequestDto {
    private String username;
    private String password;
    private String name;

    private Set<RoleType> roles = new HashSet<>();

}
