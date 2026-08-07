package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.OPDConsultationDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.OPDConsultationService;
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
 * 2. Completion: Marks consultation as completed, changing appointment status to COMPLETED, enabling invoice generation.
 * 3. Retrieval: Retrieves complete consultation and prescription details linked to an appointment ID.
 */
@RestController
@RequestMapping("/opd/consultations")
@RequiredArgsConstructor
public class OPDConsultationController {

    private final OPDConsultationService consultationService;

    /**
     * Saves or updates an OPD consultation record linked to a checked-in appointment.
     * 
     * Logic Flow:
     * - Checks if consultation entry already exists for appointmentId (idempotent write/update).
     * - Records clinical vitals (BP, pulse, temp, weight), chief complaint, ICD-10 diagnosis codes, and medication prescriptions.
     * - Associates prescription item details for billing/pharmacy dispatch.
     * 
     * @param appointmentId Associated appointment UUID.
     * @param dto OPDConsultationDto containing clinical notes, diagnosis, and prescription items.
     * @return ResponseEntity holding saved OPDConsultationDto.
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
     * 
     * Logic Flow:
     * - Verifies consultation entity exists and is in draft/in-progress state.
     * - Finalizes diagnosis and prescription records.
     * - Updates associated appointment status to COMPLETED.
     * - Triggers ready-for-billing notification signal for cashier.
     * 
     * @param consultationId OPD consultation UUID identifier.
     * @return ResponseEntity with completed OPDConsultationDto.
     */
    @PostMapping("/{consultationId}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> completeConsultation(@PathVariable UUID consultationId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        OPDConsultationDto completed = consultationService.completeConsultation(consultationId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(completed, "Consultation marked completed"));
    }

    /**
     * Retrieves consultation record by appointment ID.
     * 
     * @param appointmentId Unique UUID identifier of appointment.
     * @return ResponseEntity holding OPDConsultationDto details.
     */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'CASHIER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> getConsultationByAppointment(@PathVariable UUID appointmentId) {
        OPDConsultationDto consultation = consultationService.getConsultationByAppointment(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(consultation));
    }
}
