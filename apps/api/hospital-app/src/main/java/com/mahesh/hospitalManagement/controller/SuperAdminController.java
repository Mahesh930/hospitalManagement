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

/**
 * REST Controller for Multi-tenant Super Administration, Tenant Onboarding, Global Analytics, Feature Flag Control, and System User Governance.
 * 
 * Security & Governance Overview:
 * 1. Strict Protection: Secured exclusively with @PreAuthorize("hasRole('SUPER_ADMIN')").
 * 2. Multi-Tenancy Management: Provisioning, soft-deleting, suspending, and archiving hospital workspaces.
 * 3. Dynamic Feature Flags: Enabling/disabling granular functional modules (e.g. PHARMACY, LAB, BILLING) per hospital tenant.
 * 4. User Account Control: Global user account lock/unlock, administrative password resets, and user lifecycle operations.
 * 5. Platform Metrics: System-wide aggregations (total active tenants, MRR, daily appointments, total users).
 */
@RestController
@RequestMapping("/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    // ─────────────────────────────────────────────────────────────
    // HOSPITAL MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    /**
     * Onboards a new hospital tenant and provisions its isolated workspace.
     * 
     * Logic Flow:
     * - Registers tenant details, subscription plan, and admin credentials.
     * - Seeds default feature flags and system configuration.
     * 
     * @param dto Hospital onboarding request details.
     * @return ResponseEntity holding onboarded hospital metadata.
     */
    @PostMapping("/hospitals/onboard")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> onboardHospital(@RequestBody SuperAdminHospitalDto dto) {
        String admin = currentAdmin();
        SuperAdminHospitalDto onboarded = superAdminService.onboardHospital(dto, admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(onboarded, "Hospital onboarded and workspace provisioned successfully"));
    }

    /**
     * Updates configuration, metadata, or user quotas for an existing hospital workspace.
     * 
     * @param id Hospital UUID.
     * @param dto Updated hospital details payload.
     * @return ResponseEntity holding updated SuperAdminHospitalDto.
     */
    @PutMapping("/hospitals/{id}")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> updateHospital(
            @PathVariable UUID id,
            @RequestBody SuperAdminHospitalDto dto) {
        String admin = currentAdmin();
        SuperAdminHospitalDto updated = superAdminService.updateHospital(id, dto, admin);
        return ResponseEntity.ok(ApiResponse.success(updated, "Hospital configuration updated successfully"));
    }

    /**
     * Provisions a new Admin or Staff user account assigned directly to a specific hospital workspace.
     * 
     * @param id Hospital UUID.
     * @param dto User creation details (username, password, phone, role).
     * @return ResponseEntity with created SuperAdminUserDto.
     */
    @PostMapping("/hospitals/{id}/users")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> createHospitalUser(
            @PathVariable UUID id,
            @RequestBody CreateUserRequestDto dto) {
        String admin = currentAdmin();
        SuperAdminUserDto user = superAdminService.createHospitalUser(id, dto, admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(user, "Hospital user provisioned successfully"));
    }

    /**
     * Retrieves a list of all registered hospital tenants.
     * 
     * @return ResponseEntity with list of SuperAdminHospitalDto records.
     */
    @GetMapping("/hospitals")
    public ResponseEntity<ApiResponse<List<SuperAdminHospitalDto>>> getAllHospitals() {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.getAllHospitals()));
    }

    /**
     * Paginated search for hospital tenants by name or code.
     * 
     * @param search Query string.
     * @param page Zero-based page index.
     * @param size Page size.
     * @return ResponseEntity containing paginated hospital records.
     */
    @GetMapping("/hospitals/search")
    public ResponseEntity<ApiResponse<Page<SuperAdminHospitalDto>>> searchHospitals(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.searchHospitals(search, page, size)));
    }

    /**
     * Suspends or unsuspends a hospital tenant's access.
     * 
     * @param id Hospital UUID.
     * @param suspend true to suspend, false to activate.
     * @return ResponseEntity with updated hospital status.
     */
    @PatchMapping("/hospitals/{id}/suspend")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> toggleHospitalStatus(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean suspend) {
        String admin = currentAdmin();
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.toggleHospitalStatus(id, suspend, admin), "Hospital status updated"));
    }

    /**
     * Archives a hospital tenant workspace.
     * 
     * @param id Hospital UUID.
     * @return ResponseEntity with archived hospital entity.
     */
    @PatchMapping("/hospitals/{id}/archive")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> archiveHospital(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.archiveHospital(id, currentAdmin()), "Hospital archived"));
    }

    /**
     * Soft-deletes a hospital tenant record without permanent data destruction.
     * 
     * @param id Hospital UUID.
     * @return ResponseEntity with soft-deleted hospital entity.
     */
    @DeleteMapping("/hospitals/{id}")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> deleteHospital(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.softDeleteHospital(id, currentAdmin()), "Hospital deleted (soft)"));
    }

    /**
     * Restores a soft-deleted hospital tenant account.
     * 
     * @param id Hospital UUID.
     * @return ResponseEntity with restored hospital record.
     */
    @PatchMapping("/hospitals/{id}/restore")
    public ResponseEntity<ApiResponse<SuperAdminHospitalDto>> restoreHospital(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.restoreHospital(id, currentAdmin()), "Hospital restored"));
    }

    // ─────────────────────────────────────────────────────────────
    // PLATFORM STATS
    // ─────────────────────────────────────────────────────────────

    /**
     * Aggregates real-time platform statistics for super-admin dashboard analytics.
     * 
     * @return ResponseEntity containing PlatformStatsDto metrics.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PlatformStatsDto>> getPlatformStats() {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.getPlatformStats()));
    }

    // ─────────────────────────────────────────────────────────────
    // FEATURE FLAGS
    // ─────────────────────────────────────────────────────────────

    /**
     * Retrieves all module feature flag statuses for a hospital.
     * 
     * @param id Hospital UUID.
     * @return ResponseEntity holding feature flags list.
     */
    @GetMapping("/hospitals/{id}/features")
    public ResponseEntity<ApiResponse<List<FeatureFlagDto>>> getHospitalFeatureFlags(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.getHospitalFeatureFlags(id)));
    }

    /**
     * Enables or disables a feature module for a specific hospital tenant.
     * 
     * @param id Hospital UUID.
     * @param moduleCode Feature module key (e.g. PHARMACY, LAB, IPD).
     * @param enabled Desired state.
     * @return ResponseEntity containing updated FeatureFlagDto.
     */
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

    /**
     * Paginated search for users across all hospital tenants.
     * 
     * @param search Search query string.
     * @param hospitalId Optional hospital tenant filter UUID.
     * @param page Page index.
     * @param size Page size.
     * @return ResponseEntity containing user search results page.
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<SuperAdminUserDto>>> searchUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) UUID hospitalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.searchUsers(search, hospitalId, page, size)));
    }

    /**
     * Paginated retrieval of users belonging to a specific hospital tenant.
     * 
     * @param id Hospital UUID.
     * @param search Search query string.
     * @param page Page index.
     * @param size Page size.
     * @return ResponseEntity containing list of users belonging to the specified hospital.
     */
    @GetMapping("/hospitals/{id}/users")
    public ResponseEntity<ApiResponse<Page<SuperAdminUserDto>>> getHospitalUsers(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(superAdminService.searchUsers(search, id, page, size)));
    }

    /**
     * Locks a user account to prevent login authentication.
     * 
     * @param id User UUID.
     * @return ResponseEntity containing locked user details.
     */
    @PatchMapping("/users/{id}/lock")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> lockUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.lockUser(id, currentAdmin()), "User account locked"));
    }

    /**
     * Unlocks a locked user account.
     * 
     * @param id User UUID.
     * @return ResponseEntity containing unlocked user details.
     */
    @PatchMapping("/users/{id}/unlock")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> unlockUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.unlockUser(id, currentAdmin()), "User account unlocked"));
    }

    /**
     * Forces an administrative password reset for a target user account.
     * 
     * @param id User UUID.
     * @param newPassword Raw replacement password string.
     * @return ResponseEntity with reset status confirmation.
     */
    @PatchMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> resetPassword(
            @PathVariable UUID id,
            @RequestParam String newPassword) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.resetUserPassword(id, newPassword, currentAdmin()), "Password reset successfully"));
    }

    /**
     * Soft-deletes a user account.
     * 
     * @param id User UUID.
     * @return ResponseEntity with soft-deleted user details.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> deleteUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.softDeleteUser(id, currentAdmin()), "User deleted (soft)"));
    }

    /**
     * Restores a soft-deleted user account.
     * 
     * @param id User UUID.
     * @return ResponseEntity with restored user details.
     */
    @PatchMapping("/users/{id}/restore")
    public ResponseEntity<ApiResponse<SuperAdminUserDto>> restoreUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                superAdminService.restoreUser(id, currentAdmin()), "User restored"));
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────

    /**
     * Helper method to extract the username of the current Super Admin from SecurityContext.
     */
    private String currentAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
