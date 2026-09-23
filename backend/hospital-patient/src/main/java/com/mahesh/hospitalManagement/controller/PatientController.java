package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.PatientDto;
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
     * Retrieves a patient profile by primary UUID.
     * 
     * @param id Unique UUID identifier of the patient.
     * @return ResponseEntity with PatientDto wrapped in ApiResponse.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE')")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientById(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto patient = patientService.getPatientById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    /**
     * Retrieves a patient profile using their Universal Health Identifier (UHID).
     * 
     * @param uhid Unique business identifier assigned to the patient.
     * @return ResponseEntity with PatientDto wrapped in ApiResponse.
     */
    @GetMapping("/uhid/{uhid}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE')")
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
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE', 'SUPER_ADMIN')")
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
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE', 'SUPER_ADMIN')")
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
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<com.mahesh.hospitalManagement.dto.PatientTimelineDto>> getPatientTimeline(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        com.mahesh.hospitalManagement.dto.PatientTimelineDto timeline = patientService.getPatientLongitudinalTimeline(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(timeline, "Patient timeline retrieved successfully"));
    }
}
