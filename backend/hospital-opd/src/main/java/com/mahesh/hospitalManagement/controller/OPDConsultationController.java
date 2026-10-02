package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.ClinicalAmendmentDto;
import com.mahesh.hospitalManagement.dto.ClinicalSafetyCheckDto;
import com.mahesh.hospitalManagement.dto.OPDConsultationDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.OPDConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for managing Outpatient Department (OPD) clinical consultations.
 * 
 * Logic Overview:
 * 1. Start/Save: Creates or updates clinical consultation notes, vital signs, chief complaints, ICD diagnoses, and prescriptions.
 * 2. Completion: Marks consultation as completed, enforcing finalized consultation protection.
 * 3. Amendment: Allows controlled, audited clinical amendments to completed consultations.
 * 4. Clinical Safety: Pre-flight allergy and drug interaction validation.
 * 5. Retrieval: Retrieves complete consultation and prescription details.
 */
@RestController
@RequestMapping("/opd/consultations")
@RequiredArgsConstructor
public class OPDConsultationController {

    private final OPDConsultationService consultationService;

    /**
     * Saves or updates an OPD consultation record linked to a checked-in appointment.
     */
    @PostMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> saveConsultation(
            @PathVariable UUID appointmentId,
            @RequestBody OPDConsultationDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        OPDConsultationDto saved = consultationService.startOrCreateConsultation(appointmentId, dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(saved, "Consultation record saved successfully"));
    }

    /**
     * Completes an active OPD consultation.
     */
    @PostMapping("/{consultationId}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> completeConsultation(@PathVariable UUID consultationId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        OPDConsultationDto completed = consultationService.completeConsultation(consultationId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(completed, "Consultation marked completed"));
    }

    /**
     * Amends a finalized consultation with audited justification.
     */
    @PostMapping("/{consultationId}/amend")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> amendConsultation(
            @PathVariable UUID consultationId,
            @Valid @RequestBody ClinicalAmendmentDto amendmentDto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        OPDConsultationDto amended = consultationService.amendConsultation(consultationId, amendmentDto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(amended, "Consultation record amended successfully"));
    }

    /**
     * Pre-flight clinical safety check for prescribed medicines vs patient allergies.
     */
    @PostMapping("/clinical-safety/check")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ClinicalSafetyCheckDto>> checkClinicalSafety(
            @RequestBody ClinicalSafetyCheckDto request) {
        ClinicalSafetyCheckDto result = consultationService.checkClinicalSafety(request.getPatientId(), request.getMedications());
        return ResponseEntity.ok(ApiResponse.success(result, "Clinical safety check performed"));
    }

    /**
     * Retrieves consultation record by appointment ID.
     */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'CASHIER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> getConsultationByAppointment(@PathVariable UUID appointmentId) {
        OPDConsultationDto consultation = consultationService.getConsultationByAppointment(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(consultation));
    }

    /**
     * Retrieves consultation record by direct consultation ID.
     */
    @GetMapping("/{consultationId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'CASHIER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> getConsultationById(@PathVariable UUID consultationId) {
        OPDConsultationDto consultation = consultationService.getConsultationById(consultationId);
        return ResponseEntity.ok(ApiResponse.success(consultation));
    }
}
