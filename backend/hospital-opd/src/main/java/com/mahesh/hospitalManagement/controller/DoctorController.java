package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.entity.DiagnosisCatalogue;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.MedicineCatalogue;
import com.mahesh.hospitalManagement.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Doctor clinical workspace actions in MediCore ERP.
 * 
 * Logic Overview:
 * - Real-time Doctor Clinical Dashboard (queue, vitals, allergy alerts).
 * - Patient Queue Operations (Call, Skip, Consult).
 * - 360-Degree Clinical Summaries & Chronological Patient Timelines.
 * - Investigation Orders (Lab & Radiology), Results Retrieval, Abnormal Reviews.
 * - Inpatient Ward Rounds (SOAP Progress Notes) & Active Inpatient Monitoring.
 * - Medical Certificates (Fitness, Medical Leave, Travel).
 * - Doctor-to-Nurse Clinical Task Orders.
 * - Clinical Admission & Discharge Recommendations.
 * - ICD-10 Diagnosis and Hospital Medicine Catalogues.
 */
@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    /**
     * Retrieves the comprehensive clinical dashboard for the logged-in doctor.
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
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponseDto>> getMyProfile() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Doctor doctor = doctorService.resolveDoctorForUsername(currentUser);
        DoctorResponseDto dto = DoctorResponseDto.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .specialization(doctor.getSpecialization())
                .email(doctor.getEmail())
                .registrationNumber(doctor.getRegistrationNumber())
                .roomNumber(doctor.getRoomNumber())
                .consultationFee(doctor.getConsultationFee())
                .isAvailable(doctor.getIsAvailable())
                .phone(doctor.getPhone())
                .qualification(doctor.getQualification())
                .experienceYears(doctor.getExperienceYears())
                .scheduleSummary(doctor.getScheduleSummary())
                .build();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * Updates permitted doctor professional information.
     */
    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponseDto>> updateProfile(@RequestBody DoctorResponseDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DoctorResponseDto updated = doctorService.updateDoctorProfile(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Doctor profile updated successfully"));
    }

    /**
     * Calls a waiting patient into the doctor's consultation room.
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
     */
    @PatchMapping("/availability")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponseDto>> updateAvailability(@RequestBody Map<String, Object> payload) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Boolean isAvailable = payload.containsKey("isAvailable") ? (Boolean) payload.get("isAvailable") : null;
        String roomNumber = payload.containsKey("roomNumber") ? (String) payload.get("roomNumber") : null;
        DoctorResponseDto updated = doctorService.updateDoctorAvailability(currentUser, isAvailable, roomNumber);
        return ResponseEntity.ok(ApiResponse.success(updated, "Availability updated successfully"));
    }

    /**
     * Retrieves 360-degree patient clinical summary (allergies, vitals, history, active Rx, tests).
     */
    @GetMapping("/patients/{patientId}/summary")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PatientClinicalSummaryDto>> getPatientClinicalSummary(@PathVariable UUID patientId) {
        PatientClinicalSummaryDto summary = doctorService.getPatientClinicalSummary(patientId);
        return ResponseEntity.ok(ApiResponse.success(summary, "Patient clinical summary loaded"));
    }

    /**
     * Retrieves chronological clinical events timeline for a patient.
     */
    @GetMapping("/patients/{patientId}/timeline")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ClinicalTimelineEventDto>>> getPatientClinicalTimeline(@PathVariable UUID patientId) {
        List<ClinicalTimelineEventDto> timeline = doctorService.getPatientClinicalTimeline(patientId);
        return ResponseEntity.ok(ApiResponse.success(timeline, "Patient clinical timeline loaded"));
    }

    /**
     * Orders a laboratory or radiology investigation.
     */
    @PostMapping("/investigations")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorInvestigationResultDto>> orderInvestigation(
            @Valid @RequestBody DoctorInvestigationOrderDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DoctorInvestigationResultDto result = doctorService.orderInvestigation(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(result, "Investigation ordered successfully"));
    }

    /**
     * Fetches doctor's investigation orders and results, with optional category and abnormal filter.
     */
    @GetMapping("/investigations")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<DoctorInvestigationResultDto>>> getInvestigations(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean abnormalOnly) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        List<DoctorInvestigationResultDto> list = doctorService.getDoctorInvestigations(currentUser, category, abnormalOnly);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Reviews and signs off on an investigation result (particularly abnormal findings).
     */
    @PostMapping("/investigations/{bookingId}/review")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorInvestigationResultDto>> reviewInvestigation(
            @PathVariable UUID bookingId,
            @RequestBody Map<String, String> payload) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        String notes = payload.getOrDefault("reviewNotes", "Reviewed by clinician");
        DoctorInvestigationResultDto reviewed = doctorService.reviewAbnormalInvestigation(bookingId, notes, currentUser);
        return ResponseEntity.ok(ApiResponse.success(reviewed, "Investigation reviewed and signed off"));
    }

    /**
     * Records an Inpatient Ward Round SOAP Progress Note.
     */
    @PostMapping("/ipd/progress-notes")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<InpatientProgressNoteDto>> createProgressNote(
            @Valid @RequestBody InpatientProgressNoteDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        InpatientProgressNoteDto saved = doctorService.createInpatientProgressNote(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(saved, "Inpatient progress note recorded"));
    }

    /**
     * Returns progress notes for an inpatient admission.
     */
    @GetMapping("/ipd/admissions/{admissionId}/progress-notes")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<InpatientProgressNoteDto>>> getProgressNotes(@PathVariable UUID admissionId) {
        List<InpatientProgressNoteDto> notes = doctorService.getInpatientProgressNotes(admissionId);
        return ResponseEntity.ok(ApiResponse.success(notes));
    }

    /**
     * Issues an official medical certificate.
     */
    @PostMapping("/certificates")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicalCertificateDto>> issueCertificate(
            @Valid @RequestBody MedicalCertificateDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        MedicalCertificateDto issued = doctorService.issueMedicalCertificate(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(issued, "Medical certificate issued successfully"));
    }

    /**
     * Lists all medical certificates issued to a patient.
     */
    @GetMapping("/patients/{patientId}/certificates")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicalCertificateDto>>> getPatientCertificates(@PathVariable UUID patientId) {
        List<MedicalCertificateDto> list = doctorService.getPatientCertificates(patientId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Assigns a clinical task or instruction to nursing staff.
     */
    @PostMapping("/nurse-instructions")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DoctorNurseInstructionDto>> assignNurseInstruction(
            @Valid @RequestBody DoctorNurseInstructionDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        DoctorNurseInstructionDto result = doctorService.createDoctorToNurseInstruction(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(result, "Doctor instruction assigned to nursing staff"));
    }

    /**
     * Recommends inpatient admission for an OPD or emergency patient.
     */
    @PostMapping("/recommendations/admission")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> recommendAdmission(@Valid @RequestBody AdmissionRecommendationDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        doctorService.recommendAdmission(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Admission recommendation recorded"));
    }

    /**
     * Documents clinical discharge recommendation and instructions.
     */
    @PostMapping("/recommendations/discharge")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> recommendDischarge(@Valid @RequestBody DischargeRecommendationDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        doctorService.recommendDischarge(dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Discharge recommendation recorded"));
    }

    /**
     * Lists active IPD inpatients assigned to the doctor.
     */
    @GetMapping("/ipd/inpatients")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveInpatients() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Map<String, Object>> inpatients = doctorService.getActiveInpatients(currentUser);
        return ResponseEntity.ok(ApiResponse.success(inpatients));
    }

    /**
     * Searches ICD-10 diagnosis catalogue.
     */
    @GetMapping("/catalogues/diagnoses")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<DiagnosisCatalogue>>> searchDiagnoses(@RequestParam(required = false) String query) {
        List<DiagnosisCatalogue> list = doctorService.searchDiagnosesCatalogue(query);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Searches hospital medicine master catalogue.
     */
    @GetMapping("/catalogues/medicines")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineCatalogue>>> searchMedicines(@RequestParam(required = false) String query) {
        List<MedicineCatalogue> list = doctorService.searchMedicinesCatalogue(query);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}