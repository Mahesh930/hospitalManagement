package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.RoleCatalogItemDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.service.RoleCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleCatalogController {

    private final RoleCatalogService roleCatalogService;

    @GetMapping("/catalog")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<RoleCatalogItemDto>>> getCatalog() {
        return ResponseEntity.ok(ApiResponse.success(roleCatalogService.getCatalog(), "Role catalog"));
    }

    @GetMapping("/{role}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RoleCatalogItemDto>> getRole(@PathVariable String role) {
        RoleType roleType = RoleType.valueOf(role.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(roleCatalogService.getRole(roleType)));
    }

    @GetMapping("/me/station")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> myStation(Authentication authentication) {
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .collect(Collectors.toList());

        List<RoleCatalogItemDto> stations = roles.stream()
                .filter(r -> {
                    try {
                        RoleType.valueOf(r);
                        return true;
                    } catch (IllegalArgumentException ex) {
                        return false;
                    }
                })
                .map(r -> roleCatalogService.getRole(RoleType.valueOf(r)))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "username", authentication.getName(),
                "roles", roles,
                "stations", stations
        )));
    }
}
