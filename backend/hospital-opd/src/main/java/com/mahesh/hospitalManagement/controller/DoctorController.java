package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.DoctorDashboardDto;
import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Doctor-specific clinical workspace actions.
 * 
 * Logic Overview:
 * - Provides Doctor Clinical Dashboard with real-time OPD queues, vitals summaries, safety alerts.
 * - Manages queue transitions (Calling patient, Skipping patient, Starting consultation).
 * - Manages Doctor schedule and availability settings.
 */
@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final ModelMapper modelMapper;

    /**
     * Retrieves the comprehensive clinical dashboard for the logged-in doctor.
     * 
     * @return ResponseEntity with DoctorDashboardDto.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorDashboardDto>> getDoctorDashboard() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DoctorDashboardDto dashboard = doctorService.getDoctorDashboard(currentUser);
        return ResponseEntity.ok(ApiResponse.success(dashboard, "Doctor dashboard loaded successfully"));
    }

    /**
     * Retrieves the profile and schedule details of the currently authenticated doctor.
     * 
     * @return ResponseEntity with DoctorResponseDto.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponseDto>> getMyProfile() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Doctor doctor = doctorService.resolveDoctorForUsername(currentUser);
        return ResponseEntity.ok(ApiResponse.success(modelMapper.map(doctor, DoctorResponseDto.class)));
    }

    /**
     * Calls a waiting patient into the doctor's consultation room.
     * 
     * @param appointmentId UUID of the appointment to call.
     * @return ResponseEntity confirming patient called.
     */
    @PostMapping("/queue/{appointmentId}/call")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> callPatient(@PathVariable UUID appointmentId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        doctorService.callPatientInQueue(appointmentId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Patient called into consultation"));
    }

    /**
     * Skips or marks a patient in queue as no-show.
     * 
     * @param appointmentId UUID of the appointment to skip.
     * @return ResponseEntity confirming patient status updated.
     */
    @PostMapping("/queue/{appointmentId}/skip")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> skipPatient(@PathVariable UUID appointmentId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        doctorService.skipPatientInQueue(appointmentId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Patient skipped in queue"));
    }

    /**
     * Updates doctor availability status and consultation room number.
     * 
     * @param payload Map containing isAvailable boolean and roomNumber string.
     * @return ResponseEntity with updated DoctorResponseDto.
     */
    @PatchMapping("/availability")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponseDto>> updateAvailability(@RequestBody Map<String, Object> payload) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Boolean isAvailable = payload.containsKey("isAvailable") ? (Boolean) payload.get("isAvailable") : null;
        String roomNumber = payload.containsKey("roomNumber") ? (String) payload.get("roomNumber") : null;

        DoctorResponseDto updated = doctorService.updateDoctorAvailability(currentUser, isAvailable, roomNumber);
        return ResponseEntity.ok(ApiResponse.success(updated, "Doctor availability updated"));
    }
}