package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    // ─────────────────────────────────────────────────────────────
    // HOSPITAL MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/hospitals/onboard")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> onboardHospital(@RequestBody SuperAdminHospitalDto dto) {
        String admin = currentAdmin();
        SuperAdminHospitalDto onboarded = superAdminService.onboardHospital(dto, admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(onboarded, "Hospital onboarded and workspace provisioned successfully"));
    }

    @GetMapping("/hospitals")
    public ResponseEntity<ApiResponse<List<SuperAdminHospitalDto>>> getAllHospitals() {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.getAllHospitals()));
    }

    @GetMapping("/hospitals/search")
    public ResponseEntity<ApiResponse<Page<SuperAdminHospitalDto>>> searchHospitals(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.searchHospitals(search, page, size)));
    }

    @PatchMapping("/hospitals/{id}/suspend")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> toggleHospitalStatus(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean suspend) {
        String admin = currentAdmin();
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.toggleHospitalStatus(id, suspend, admin), "Hospital status updated"));
    }

    @PatchMapping("/hospitals/{id}/archive")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> archiveHospital(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.archiveHospital(id, currentAdmin()), "Hospital archived"));
    }

    @DeleteMapping("/hospitals/{id}")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> deleteHospital(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.softDeleteHospital(id, currentAdmin()), "Hospital deleted (soft)"));
    }

    @PatchMapping("/hospitals/{id}/restore")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> restoreHospital(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.restoreHospital(id, currentAdmin()), "Hospital restored"));
    }

    // ─────────────────────────────────────────────────────────────
    // PLATFORM STATS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PlatformStatsDto>> getPlatformStats() {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.getPlatformStats()));
    }

    // ─────────────────────────────────────────────────────────────
    // FEATURE FLAGS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/hospitals/{id}/features")
    public ResponseEntity<ApiResponse<List<FeatureFlagDto>>> getHospitalFeatureFlags(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.getHospitalFeatureFlags(id)));
    }

    @PatchMapping("/hospitals/{id}/features/{moduleCode}")
    public ResponseEntity<ApiResponse<FeatureFlagDto>> toggleFeatureFlag(
            @PathVariable UUID id,
            @PathVariable String moduleCode,
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.toggleFeatureFlag(id, moduleCode, enabled, currentAdmin()), "Feature flag updated"));
    }

    // ─────────────────────────────────────────────────────────────
    // USER MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<SuperAdminUserDto>>> searchUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.searchUsers(search, page, size)));
    }

    @PatchMapping("/users/{id}/lock")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> lockUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.lockUser(id, currentAdmin()), "User account locked"));
    }

    @PatchMapping("/users/{id}/unlock")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> unlockUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.unlockUser(id, currentAdmin()), "User account unlocked"));
    }

    @PatchMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> resetPassword(
            @PathVariable UUID id,
            @RequestParam String newPassword) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.resetUserPassword(id, newPassword, currentAdmin()), "Password reset successfully"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> deleteUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.softDeleteUser(id, currentAdmin()), "User deleted (soft)"));
    }

    @PatchMapping("/users/{id}/restore")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> restoreUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.restoreUser(id, currentAdmin()), "User restored"));
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────

    private String currentAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
