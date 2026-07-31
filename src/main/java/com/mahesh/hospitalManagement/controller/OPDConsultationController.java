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

@RestController
@RequestMapping("/opd/consultations")
@RequiredArgsConstructor
public class OPDConsultationController {

    private final OPDConsultationService consultationService;

    @PostMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> saveConsultation(
            @PathVariable UUID appointmentId,
            @RequestBody OPDConsultationDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        OPDConsultationDto saved = consultationService.startOrCreateConsultation(appointmentId, dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(saved, "Consultation record saved successfully"));
    }

    @PostMapping("/{consultationId}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> completeConsultation(@PathVariable UUID consultationId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        OPDConsultationDto completed = consultationService.completeConsultation(consultationId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(completed, "Consultation marked completed"));
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'CASHIER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OPDConsultationDto>> getConsultationByAppointment(@PathVariable UUID appointmentId) {
        OPDConsultationDto consultation = consultationService.getConsultationByAppointment(appointmentId);
        return ResponseEntity.ok(ApiResponse.success(consultation));
    }
}
