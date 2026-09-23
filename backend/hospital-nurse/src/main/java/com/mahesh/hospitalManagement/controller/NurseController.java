package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.NurseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Nurse Station Operations.
 * 
 * Provides endpoints for:
 * 1. Live Nurse Station telemetry and patient triage queues.
 * 2. Pre-consultation vitals recording with automated abnormality evaluation.
 * 3. Inpatient ward and bed layout management (allocations, transfers, discharges).
 * 4. Electronic Medication Administration Records (eMAR).
 * 5. Clinical nursing progress notes and shift handover logs.
 */
@RestController
@RequestMapping({"/nurses", "/api/v1/nurses"})
@RequiredArgsConstructor
public class NurseController {

    private final NurseService nurseService;

    /**
     * Retrieves aggregated metrics for the nurse station dashboard.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<NurseDashboardDto>> getDashboardStats() {
        NurseDashboardDto stats = nurseService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Nurse dashboard metrics loaded successfully"));
    }

    /**
     * Fetches real-time queue of checked-in patients awaiting vital signs recording.
     */
    @GetMapping("/triage-queue")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<QueueManagementDto>>> getTriageQueue() {
        List<QueueManagementDto> queue = nurseService.getTriageQueue();
        return ResponseEntity.ok(ApiResponse.success(queue, "Triage queue retrieved"));
    }

    /**
     * Records pre-consultation vitals, evaluates safety alerts, and advances patient visit queue.
     */
    @PostMapping("/vitals")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<VitalSignsDto>> recordTriageVitals(@RequestBody VitalSignsDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        VitalSignsDto saved = nurseService.recordTriageVitals(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Patient vitals and triage data recorded successfully"));
    }

    /**
     * Lists all hospital wards with bed occupancy counts.
     */
    @GetMapping("/wards")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<WardDto>>> getWards(@RequestParam(required = false) UUID hospitalId) {
        List<WardDto> wards = nurseService.getWards(hospitalId);
        return ResponseEntity.ok(ApiResponse.success(wards, "Wards retrieved"));
    }

    /**
     * Creates a new ward.
     */
    @PostMapping("/wards")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<WardDto>> createWard(@RequestBody WardDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        WardDto saved = nurseService.createWard(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Ward created successfully"));
    }

    /**
     * Lists beds with live status and active patient details.
     */
    @GetMapping("/beds")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<BedDto>>> getBeds(
            @RequestParam(required = false) UUID wardId,
            @RequestParam(required = false) UUID hospitalId) {
        List<BedDto> beds = nurseService.getBeds(wardId, hospitalId);
        return ResponseEntity.ok(ApiResponse.success(beds, "Beds retrieved"));
    }

    /**
     * Creates a new bed.
     */
    @PostMapping("/beds")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BedDto>> createBed(@RequestBody BedDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        BedDto saved = nurseService.createBed(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Bed created successfully"));
    }

    /**
     * Inpatient Bed Admission / Allocation.
     */
    @PostMapping("/admissions")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BedAdmissionDto>> admitPatient(@RequestBody BedAdmissionRequestDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        BedAdmissionDto admission = nurseService.admitPatient(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(admission, "Patient successfully admitted to bed"));
    }

    /**
     * Bed Transfer: Moves patient to another bed/ward.
     */
    @PatchMapping("/admissions/{admissionId}/transfer")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BedAdmissionDto>> transferBed(
            @PathVariable UUID admissionId,
            @RequestParam UUID targetBedId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        BedAdmissionDto transferred = nurseService.transferBed(admissionId, targetBedId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(transferred, "Patient successfully transferred to new bed"));
    }

    /**
     * Discharges patient and frees bed.
     */
    @PatchMapping("/admissions/{admissionId}/discharge")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BedAdmissionDto>> dischargePatient(
            @PathVariable UUID admissionId,
            @RequestParam(required = false) String dischargeNotes) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        BedAdmissionDto discharged = nurseService.dischargePatient(admissionId, dischargeNotes, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(discharged, "Patient successfully discharged. Bed marked for cleaning."));
    }

    /**
     * Lists active bed admissions.
     */
    @GetMapping("/admissions")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<BedAdmissionDto>>> getActiveAdmissions(
            @RequestParam(required = false) UUID hospitalId) {
        List<BedAdmissionDto> admissions = nurseService.getActiveAdmissions(hospitalId);
        return ResponseEntity.ok(ApiResponse.success(admissions, "Active admissions retrieved"));
    }

    /**
     * Retrieves prescription items due for medication administration.
     */
    @GetMapping("/emar/patient/{patientId}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicationAdministrationDto>>> getPatientPrescriptionsDue(
            @PathVariable UUID patientId) {
        List<MedicationAdministrationDto> items = nurseService.getPatientPrescriptionsDue(patientId);
        return ResponseEntity.ok(ApiResponse.success(items, "Prescriptions due retrieved"));
    }

    /**
     * Records a medication administration log in eMAR.
     */
    @PostMapping("/emar/administer")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<MedicationAdministrationDto>> recordMedicationAdministration(
            @RequestBody MedicationAdministrationRequestDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        MedicationAdministrationDto saved = nurseService.recordMedicationAdministration(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Medication administration logged"));
    }

    /**
     * Fetches eMAR history for a patient.
     */
    @GetMapping("/emar/history/{patientId}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicationAdministrationDto>>> getPatientMedicationHistory(
            @PathVariable UUID patientId) {
        List<MedicationAdministrationDto> history = nurseService.getPatientMedicationHistory(patientId);
        return ResponseEntity.ok(ApiResponse.success(history, "Medication history retrieved"));
    }

    /**
     * Adds a clinical nursing progress or handover note.
     */
    @PostMapping("/notes")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<NursingNoteDto>> addNursingNote(@RequestBody NursingNoteDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        NursingNoteDto saved = nurseService.addNursingNote(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Nursing note recorded"));
    }

    /**
     * Retrieves nursing notes for a patient.
     */
    @GetMapping("/notes/patient/{patientId}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<NursingNoteDto>>> getPatientNursingNotes(
            @PathVariable UUID patientId) {
        List<NursingNoteDto> notes = nurseService.getPatientNursingNotes(patientId);
        return ResponseEntity.ok(ApiResponse.success(notes, "Nursing notes retrieved"));
    }

    /**
     * Retrieves the assigned ward of the logged-in nurse.
     */
    @GetMapping("/assigned-ward")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<WardDto>> getAssignedWard() {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        WardDto ward = nurseService.getAssignedWard(currentNurse);
        return ResponseEntity.ok(ApiResponse.success(ward, "Nurse assigned ward retrieved"));
    }

    /**
     * Updates or assigns the active ward for the logged-in nurse.
     */
    @PatchMapping("/assigned-ward")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<WardDto>> setAssignedWard(@RequestParam UUID wardId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        WardDto ward = nurseService.setAssignedWard(currentNurse, wardId);
        return ResponseEntity.ok(ApiResponse.success(ward, "Nurse assigned ward updated successfully"));
    }

    // ==========================================
    // 1. FLUID BALANCE & INTAKE / OUTPUT (I/O)
    // ==========================================

    @PostMapping("/fluid-balance")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<FluidBalanceDto>> recordFluidBalance(@RequestBody FluidBalanceDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        FluidBalanceDto saved = nurseService.recordFluidBalance(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Fluid balance entry recorded successfully"));
    }

    @GetMapping("/fluid-balance/patient/{patientId}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<FluidBalanceSummaryDto>> getFluidBalanceSummary(@PathVariable UUID patientId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        FluidBalanceSummaryDto summary = nurseService.getFluidBalanceSummary(patientId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(summary, "Fluid balance summary retrieved"));
    }

    // ==========================================
    // 2. SPECIALIZED BEDSIDE & WOUND CARE
    // ==========================================

    @PostMapping("/bedside-care")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<NursingCareRecordDto>> recordBedsideCare(@RequestBody NursingCareRecordDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        NursingCareRecordDto saved = nurseService.recordBedsideCare(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Bedside care procedure logged successfully"));
    }

    @GetMapping("/bedside-care/patient/{patientId}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<NursingCareRecordDto>>> getPatientBedsideCareHistory(@PathVariable UUID patientId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        List<NursingCareRecordDto> history = nurseService.getPatientBedsideCareHistory(patientId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(history, "Bedside care history retrieved"));
    }

    // ==========================================
    // 3. NURSING TASKS & WORKLOAD
    // ==========================================

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<NursingTaskDto>>> getWardTasks(@RequestParam(required = false) UUID wardId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        List<NursingTaskDto> tasks = nurseService.getWardTasks(wardId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(tasks, "Nursing tasks retrieved"));
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<NursingTaskDto>> createNursingTask(@RequestBody NursingTaskDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        NursingTaskDto saved = nurseService.createNursingTask(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Nursing task scheduled successfully"));
    }

    @PatchMapping("/tasks/{taskId}/complete")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<NursingTaskDto>> completeNursingTask(
            @PathVariable UUID taskId,
            @RequestParam(required = false) String completionNotes) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        NursingTaskDto completed = nurseService.completeNursingTask(taskId, completionNotes, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(completed, "Nursing task marked as completed"));
    }

    // ==========================================
    // 4. DOCTOR NOTIFICATION & CLINICAL ESCALATION
    // ==========================================

    @PostMapping("/escalations")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<ClinicalEscalationDto>> createClinicalEscalation(@RequestBody ClinicalEscalationDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        ClinicalEscalationDto saved = nurseService.createClinicalEscalation(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Clinical escalation alert broadcast to doctor"));
    }

    @GetMapping("/escalations")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<ClinicalEscalationDto>>> getWardEscalations(@RequestParam(required = false) UUID wardId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ClinicalEscalationDto> alerts = nurseService.getWardEscalations(wardId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(alerts, "Clinical escalations retrieved"));
    }

    @PatchMapping("/escalations/{escalationId}/acknowledge")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ClinicalEscalationDto>> acknowledgeEscalation(
            @PathVariable UUID escalationId,
            @RequestParam(required = false) String doctorResponse) {
        String doctorName = SecurityContextHolder.getContext().getAuthentication().getName();
        ClinicalEscalationDto acknowledged = nurseService.acknowledgeEscalation(escalationId, doctorResponse, doctorName);
        return ResponseEntity.ok(ApiResponse.success(acknowledged, "Clinical escalation acknowledged by doctor"));
    }

    // ==========================================
    // 5. CLINICAL RISK ASSESSMENTS & CHECKLISTS
    // ==========================================

    @PostMapping("/assessments")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<NursingAssessmentDto>> recordAssessment(@RequestBody NursingAssessmentDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        NursingAssessmentDto saved = nurseService.recordAssessment(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Clinical assessment saved successfully"));
    }

    @GetMapping("/assessments/patient/{patientId}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<NursingAssessmentDto>>> getPatientAssessments(@PathVariable UUID patientId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        List<NursingAssessmentDto> list = nurseService.getPatientAssessments(patientId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(list, "Patient clinical assessments retrieved"));
    }

    // ==========================================
    // 6. HOSPITAL INCIDENT REPORTING
    // ==========================================

    @PostMapping("/incidents")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<NursingIncidentDto>> reportIncident(@RequestBody NursingIncidentDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        NursingIncidentDto saved = nurseService.reportIncident(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Incident report submitted successfully"));
    }

    @GetMapping("/incidents")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<NursingIncidentDto>>> getWardIncidents(@RequestParam(required = false) UUID wardId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        List<NursingIncidentDto> incidents = nurseService.getWardIncidents(wardId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(incidents, "Incident reports retrieved"));
    }

    // ==========================================
    // 7. SHIFT HANDOVER REPORTS
    // ==========================================

    @PostMapping("/handovers")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<ShiftHandoverReportDto>> createShiftHandover(@RequestBody ShiftHandoverReportDto dto) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        ShiftHandoverReportDto saved = nurseService.createShiftHandover(dto, currentNurse);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Shift handover report submitted successfully"));
    }

    @GetMapping("/handovers")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<ShiftHandoverReportDto>>> getWardHandovers(@RequestParam(required = false) UUID wardId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ShiftHandoverReportDto> handovers = nurseService.getWardHandovers(wardId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(handovers, "Shift handover reports retrieved"));
    }

    // ==========================================
    // 8. CONSOLIDATED INPATIENT CLINICAL SUMMARY
    // ==========================================

    @GetMapping("/inpatient-summary/{patientId}")
    @PreAuthorize("hasAnyRole('NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InpatientSummaryDto>> getInpatientSummary(@PathVariable UUID patientId) {
        String currentNurse = SecurityContextHolder.getContext().getAuthentication().getName();
        InpatientSummaryDto summary = nurseService.getInpatientSummary(patientId, currentNurse);
        return ResponseEntity.ok(ApiResponse.success(summary, "Inpatient clinical summary retrieved"));
    }
}
