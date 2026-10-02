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

    /**
     * Verifies patient registration document.
     */
    @PatchMapping("/documents/{documentId}/verify")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientDocumentDto>> verifyPatientDocument(@PathVariable UUID documentId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientDocumentDto verified = receptionistService.verifyPatientDocument(documentId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(verified, "Document verified successfully"));
    }

    /**
     * Checks for duplicate patients by phone, name, email, or national ID before registration.
     */
    @GetMapping("/duplicate-check")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<DuplicateCheckDto>> checkDuplicatePatient(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String aadhaar) {
        DuplicateCheckDto check = receptionistService.checkDuplicatePatient(phone, name, email, aadhaar);
        return ResponseEntity.ok(ApiResponse.success(check));
    }

    /**
     * Submits a formal patient duplicate record merge request.
     */
    @PostMapping("/merge-requests")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientMergeRequestDto>> createMergeRequest(@RequestBody PatientMergeRequestDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientMergeRequestDto created = receptionistService.createMergeRequest(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Patient merge request submitted successfully"));
    }

    /**
     * Lists patient duplicate record merge requests.
     */
    @GetMapping("/merge-requests")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<PatientMergeRequestDto>>> getMergeRequests(
            @RequestParam(required = false) String status) {
        List<PatientMergeRequestDto> list = receptionistService.getMergeRequests(status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Retrieves doctor working hours, schedules, and active consultation queues.
     */
    @GetMapping("/doctors/schedules")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<DoctorScheduleDto>>> getDoctorSchedules() {
        List<DoctorScheduleDto> schedules = receptionistService.getDoctorSchedules();
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    /**
     * Assigns or updates patient insurance and TPA coverage at reception.
     */
    @PostMapping("/patients/{patientId}/insurance")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<InsuranceDetailsDto>> assignPatientInsurance(
            @PathVariable UUID patientId,
            @RequestBody InsuranceDetailsDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        InsuranceDetailsDto ins = receptionistService.assignPatientInsurance(patientId, dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ins, "Patient insurance assigned successfully"));
    }

    /**
     * Retrieves patient insurance policy details.
     */
    @GetMapping("/patients/{patientId}/insurance")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<InsuranceDetailsDto>> getPatientInsurance(@PathVariable UUID patientId) {
        InsuranceDetailsDto ins = receptionistService.getPatientInsurance(patientId);
        return ResponseEntity.ok(ApiResponse.success(ins));
    }

    /**
     * Schedules a diagnostic investigation (lab, radiology) appointment.
     */
    @PostMapping("/diagnostics")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<DiagnosticBookingDto>> scheduleDiagnosticBooking(
            @RequestBody DiagnosticBookingDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DiagnosticBookingDto booking = receptionistService.scheduleDiagnosticBooking(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(booking, "Diagnostic booking scheduled successfully"));
    }

    /**
     * Retrieves diagnostic investigation bookings.
     */
    @GetMapping("/diagnostics")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<DiagnosticBookingDto>>> getDiagnosticBookings(
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) String status) {
        List<DiagnosticBookingDto> bookings = receptionistService.getDiagnosticBookings(patientId, status);
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    /**
     * Creates a front-desk shift handover report.
     */
    @PostMapping("/handovers")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReceptionShiftHandoverDto>> createShiftHandover(
            @RequestBody ReceptionShiftHandoverDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        ReceptionShiftHandoverDto handover = receptionistService.createShiftHandover(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(handover, "Front desk shift handover logged successfully"));
    }

    /**
     * Retrieves front-desk shift handover reports.
     */
    @GetMapping("/handovers")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<ReceptionShiftHandoverDto>>> getShiftHandovers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ReceptionShiftHandoverDto> list = receptionistService.getShiftHandovers(date);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Registers a patient complaint or service feedback.
     */
    @PostMapping("/feedbacks")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientFeedbackDto>> registerPatientFeedback(
            @RequestBody PatientFeedbackDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientFeedbackDto saved = receptionistService.registerPatientFeedback(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Feedback registered successfully"));
    }

    /**
     * Lists patient complaints and feedbacks.
     */
    @GetMapping("/feedbacks")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<PatientFeedbackDto>>> getPatientFeedbacks(
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) String status) {
        List<PatientFeedbackDto> list = receptionistService.getPatientFeedbacks(patientId, status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Resolves a patient feedback or complaint.
     */
    @PatchMapping("/feedbacks/{feedbackId}/resolve")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientFeedbackDto>> resolvePatientFeedback(
            @PathVariable UUID feedbackId,
            @RequestParam String resolutionNotes) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        PatientFeedbackDto resolved = receptionistService.resolvePatientFeedback(feedbackId, resolutionNotes, currentUser);
        return ResponseEntity.ok(ApiResponse.success(resolved, "Feedback marked as resolved"));
    }

    /**
     * Records a lost and found patient or visitor item.
     */
    @PostMapping("/lost-and-found")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<LostAndFoundItemDto>> recordLostAndFound(
            @RequestBody LostAndFoundItemDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        LostAndFoundItemDto saved = receptionistService.recordLostAndFound(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Lost and found item logged successfully"));
    }

    /**
     * Lists lost and found items.
     */
    @GetMapping("/lost-and-found")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LostAndFoundItemDto>>> getLostAndFoundItems(
            @RequestParam(required = false) String status) {
        List<LostAndFoundItemDto> list = receptionistService.getLostAndFoundItems(status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Claims a lost and found item.
     */
    @PatchMapping("/lost-and-found/{itemId}/claim")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<LostAndFoundItemDto>> claimLostAndFound(
            @PathVariable UUID itemId,
            @RequestParam String claimedBy,
            @RequestParam(required = false) String claimantContact,
            @RequestParam(required = false) String claimantIdProof,
            @RequestParam(required = false) String remarks) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        LostAndFoundItemDto claimed = receptionistService.claimLostAndFound(itemId, claimedBy, claimantContact, claimantIdProof, remarks, currentUser);
        return ResponseEntity.ok(ApiResponse.success(claimed, "Item claimed successfully"));
    }
}
