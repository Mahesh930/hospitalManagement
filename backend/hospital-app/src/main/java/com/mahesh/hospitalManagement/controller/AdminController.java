package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.HospitalAdminStatsDto;
import com.mahesh.hospitalManagement.dto.OnboardDoctorRequestDto;
import com.mahesh.hospitalManagement.dto.PatientDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.AdminService;
import com.mahesh.hospitalManagement.service.DoctorService;
import com.mahesh.hospitalManagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Hospital Admin tasks including doctor onboarding and patient management.
 * 
 * Logic Overview:
 * 1. Doctor Onboarding: Registers a new doctor user, assigns DOCTOR role, creates Doctor entity, and links department.
 * 2. Administrative Search: Enables hospital admins to lookup patients.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PatientService patientService;
    private final DoctorService doctorService;
    private final AdminService adminService;

    /**
     * Retrieves aggregated operational dashboard statistics for Hospital Admin.
     * 
     * @return ResponseEntity with HospitalAdminStatsDto metrics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HospitalAdminStatsDto>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getHospitalAdminStats()));
    }

    /**
     * Retrieves a list of all doctors onboarded in the hospital tenant.
     * 
     * @return ResponseEntity with list of DoctorResponseDto.
     */
    @GetMapping("/doctors")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<DoctorResponseDto>>> getAllDoctors() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllDoctors()));
    }

    /**
     * Searches patients registered in the hospital tenant.
     * 
     * @param query Search query string.
     * @return ResponseEntity with matching PatientDto records list.
     */
    @GetMapping("/patients/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<PatientDto>>> searchPatients(@RequestParam(defaultValue = "") String query) {
        List<PatientDto> patients = patientService.searchPatients(query);
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    /**
     * Onboards a new doctor to the hospital workspace.
     * 
     * Logic Flow:
     * - Creates user login credentials with DOCTOR role.
     * - Links doctor profile with department, license number, consultation fee, and specialization.
     * 
     * @param dto Doctor onboarding payload.
     * @return ResponseEntity with created DoctorResponseDto.
     */
    @PostMapping("/onBoardNewDoctor")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponseDto>> onBoardNewDoctor(@RequestBody OnboardDoctorRequestDto dto) {
        DoctorResponseDto doctor = doctorService.onBoardNewDoctor(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(doctor, "Doctor onboarded successfully"));
    }
}
