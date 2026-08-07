package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.ReceptionistService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Front-Office & Receptionist Operations.
 * 
 * Includes live front-office dashboard, walk-in token generation, queue management,
 * pre-consultation vitals recording, emergency registration, patient document storage,
 * and daily receptionist operational reports.
 */
@RestController
@RequestMapping("/receptionist")
@RequiredArgsConstructor
public class ReceptionistController {

    private final ReceptionistService receptionistService;

    /**
     * Retrieves live front-office dashboard analytics and doctor queue availability.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ReceptionistDashboardDto>> getDashboardStats() {
        ReceptionistDashboardDto stats = receptionistService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * Records pre-consultation vital signs for a patient.
     */
    @PostMapping("/vitals")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<VitalSignsDto>> recordVitalSigns(@RequestBody VitalSignsDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        VitalSignsDto saved = receptionistService.recordVitalSigns(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Vital signs recorded successfully"));
    }

    /**
     * Retrieves recorded vitals associated with a specific appointment ID.
     */
    @GetMapping("/vitals/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<VitalSignsDto>> getVitalsForAppointment(@PathVariable UUID appointmentId) {
        VitalSignsDto vitals = receptionistService.getVitalSignsForAppointment(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(vitals));
    }

    /**
     * Generates a walk-in patient queue token and pushes patient to live doctor queue.
     */
    @PostMapping("/walk-in")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<QueueManagementDto>> issueWalkinToken(@RequestBody WalkinTokenRequestDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        QueueManagementDto token = receptionistService.issueWalkinToken(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(token, "Walk-in token issued successfully"));
    }

    /**
     * Performs fast-track emergency patient registration and auto-assigns queue.
     */
    @PostMapping("/emergency-register")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDto>> registerEmergencyPatient(@RequestBody EmergencyRegistrationDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDto patient = receptionistService.registerEmergencyPatient(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(patient, "Emergency patient registered with high priority queue"));
    }

    /**
     * Fetches real-time live doctor OPD queue.
     */
    @GetMapping("/queue/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<QueueManagementDto>>> getDoctorLiveQueue(@PathVariable UUID doctorId) {
        List<QueueManagementDto> queue = receptionistService.getDoctorLiveQueue(doctorId);
        return ResponseEntity.ok(ApiResponse.success(queue));
    }

    /**
     * Updates live queue item status, priority rank, or reassigns doctor.
     */
    @PatchMapping("/queue/{visitId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<QueueManagementDto>> updateQueueStatus(
            @PathVariable UUID visitId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer priorityRank,
            @RequestParam(required = false) UUID newDoctorId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        QueueManagementDto updated = receptionistService.updateQueueStatus(visitId, status, priorityRank, newDoctorId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Queue status updated"));
    }

    /**
     * Generates front-office daily operational report.
     */
    @GetMapping("/reports/daily")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DailyReceptionistReportDto>> getDailyReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailyReceptionistReportDto report = receptionistService.getDailyReport(date);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    /**
     * Uploads patient document metadata.
     */
    @PostMapping("/patients/{patientId}/documents")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDocumentDto>> uploadPatientDocument(
            @PathVariable UUID patientId,
            @RequestBody PatientDocumentDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDocumentDto doc = receptionistService.uploadPatientDocument(patientId, dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(doc, "Document uploaded successfully"));
    }

    /**
     * Retrieves patient document list.
     */
    @GetMapping("/patients/{patientId}/documents")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PatientDocumentDto>>> getPatientDocuments(@PathVariable UUID patientId) {
        List<PatientDocumentDto> docs = receptionistService.getPatientDocuments(patientId);
        return ResponseEntity.ok(ApiResponse.success(docs));
    }
}
