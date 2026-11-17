package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.dto.PatientPortalDto;
import com.mahesh.hospitalManagement.dto.PatientTimelineDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for managing Patient profiles, registrations, lookups, searches, and allergy records.
 * 
 * Logic & Security Overview:
 * 1. RBAC Enforced: Only authorized roles (RECEPTIONIST, DOCTOR, NURSE, ADMIN) can perform operations.
 * 2. Automatic UHID Generation: Auto-generates unique Universal Health Identifiers (UHID) during registration.
 * 3. Audit Context: Captures current security context user identifier for audit trails (createdBy / updatedBy).
 */
@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    /**
     * Registers a new patient record into the system.
     * 
     * Logic Flow:
     * - Extract authenticated username from SecurityContext for audit logging.
     * - Delegate to PatientService to validate input, generate a unique UHID (e.g. UHID-2026-XXXX), and save entity.
     * - Return HTTP 201 Created with standard ApiResponse envelope.
     * 
     * @param requestDto Patient demographics (name, DOB, gender, contact, address).
     * @return ResponseEntity with created PatientDto wrapped in ApiResponse.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDto>> registerPatient(@RequestBody PatientDto requestDto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto created = patientService.registerPatient(requestDto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Patient registered successfully"));
    }

    /**
     * Updates permitted demographic, contact, and emergency contact details for an existing patient.
     * 
     * @param id Patient unique UUID identifier.
     * @param requestDto Patient updated demographics and contact fields.
     * @return ResponseEntity with updated PatientDto wrapped in ApiResponse.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDto>> updatePatientProfile(
            @PathVariable UUID id,
            @RequestBody PatientDto requestDto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto updated = patientService.updatePatient(id, requestDto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Patient details updated successfully"));
    }

    /**
     * Retrieves a patient profile by primary UUID.
     * 
     * @param id Unique UUID identifier of the patient.
     * @return ResponseEntity with PatientDto wrapped in ApiResponse.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE', 'PATIENT', 'MRD', 'TPA_INSURANCE', 'PHYSIOTHERAPIST', 'RADIOLOGIST', 'ANESTHETIST', 'QUALITY_OFFICER')")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientById(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto patient = patientService.getPatientById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    /**
     * Retrieves the authenticated patient's own profile.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PatientDto>> getMyProfile() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto patient = patientService.getMyProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    /**
     * Retrieves the authenticated patient's comprehensive health portal dashboard data.
     */
    @GetMapping("/me/portal")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PatientPortalDto>> getMyPortal() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientPortalDto portal = patientService.getMyPortal(currentUser);
        return ResponseEntity.ok(ApiResponse.success(portal));
    }

    /**
     * Retrieves a patient profile using their Universal Health Identifier (UHID).
     * 
     * @param uhid Unique business identifier assigned to the patient.
     * @return ResponseEntity with PatientDto wrapped in ApiResponse.
     */
    @GetMapping("/uhid/{uhid}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE', 'MRD', 'TPA_INSURANCE')")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientByUhid(@PathVariable String uhid) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto patient = patientService.getPatientByUhid(uhid, currentUser);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    /**
     * Retrieves all active patient records or performs a server-side search across patient records by name, phone number, or UHID.
     * 
     * @param query Optional search string term.
     * @return ResponseEntity containing list of matching PatientDto records.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE', 'SUPER_ADMIN', 'MRD', 'HR_ADMIN', 'QUALITY_OFFICER', 'PHYSIOTHERAPIST', 'OT_COORDINATOR')")
    public ResponseEntity<ApiResponse<List<PatientDto>>> getAllPatients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID hospitalId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        List<PatientDto> patients = patientService.searchPatients(query, hospitalId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    /**
     * Performs a server-side search across patient records by name, phone number, or UHID.
     * 
     * @param query Search string term.
     * @param hospitalId Optional hospital tenant filter UUID.
     * @return ResponseEntity containing list of matching PatientDto records.
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE', 'SUPER_ADMIN', 'MRD', 'TPA_INSURANCE', 'PHYSIOTHERAPIST', 'OT_COORDINATOR')")
    public ResponseEntity<ApiResponse<List<PatientDto>>> searchPatients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID hospitalId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        List<PatientDto> patients = patientService.searchPatients(query, hospitalId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    /**
     * Records a clinical allergy entry for an existing patient.
     * 
     * Logic Flow:
     * - Identifies patient by UUID.
     * - Appends allergy information (allergen, severity, reaction) to patient's medical profile.
     * - Records audit details with current user context.
     * 
     * @param id Patient UUID identifier.
     * @param allergyDto Allergy payload (allergen, severity, notes).
     * @return ResponseEntity holding updated PatientDto.
     */
    @PostMapping("/{id}/allergies")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDto>> addAllergy(
            @PathVariable UUID id,
            @RequestBody PatientDto.AllergyDto allergyDto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto updated = patientService.addAllergy(id, allergyDto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Allergy recorded successfully"));
    }

    /**
     * Retrieves the complete longitudinal medical record and chronological timeline for a patient.
     *
     * @param id Patient UUID identifier.
     * @return ResponseEntity holding PatientTimelineDto.
     */
    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientTimelineDto>> getPatientTimeline(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        com.mahesh.hospitalManagement.dto.PatientTimelineDto timeline = patientService.getPatientLongitudinalTimeline(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(timeline, "Patient timeline retrieved successfully"));
    }
}
