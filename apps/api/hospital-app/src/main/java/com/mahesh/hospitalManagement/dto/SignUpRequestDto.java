package com.mahesh.hospitalManagement.dto;

import com.mahesh.hospitalManagement.entity.type.RoleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignUpRequestDto {
    @NotBlank
    @Size(min = 3, max = 80)
    private String username;

    @NotBlank
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String password;

    private String name;

    private Set<RoleType> roles = new HashSet<>();

}
