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

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDto>> registerPatient(@RequestBody PatientDto requestDto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto created = patientService.registerPatient(requestDto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Patient registered successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE')")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientById(@PathVariable UUID id) {
        PatientDto patient = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    @GetMapping("/uhid/{uhid}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE')")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientByUhid(@PathVariable String uhid) {
        PatientDto patient = patientService.getPatientByUhid(uhid);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'NURSE')")
    public ResponseEntity<ApiResponse<List<PatientDto>>> searchPatients(@RequestParam String query) {
        List<PatientDto> patients = patientService.searchPatients(query);
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    @PostMapping("/{id}/allergies")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDto>> addAllergy(
            @PathVariable UUID id,
            @RequestBody PatientDto.AllergyDto allergyDto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto updated = patientService.addAllergy(id, allergyDto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Allergy recorded successfully"));
    }
}
