package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.LabResultEntryDto;
import com.mahesh.hospitalManagement.dto.LabSampleCollectionDto;
import com.mahesh.hospitalManagement.dto.LabStatsDto;
import com.mahesh.hospitalManagement.dto.LabWorklistItemDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.LabService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Laboratory, Diagnostics, Specimen Collection, and Analytical Reporting.
 */
@RestController
@RequestMapping({"/lab", "/api/v1/lab"})
@RequiredArgsConstructor
public class LabController {

    private final LabService labService;

    /**
     * Retrieves the laboratory worklist with optional status, category, and patient/test query filter.
     */
    @GetMapping("/worklist")
    @PreAuthorize("hasAnyRole('LAB_TECH', 'LAB_MANAGER', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'NURSE', 'RADIOLOGIST', 'RADIOLOGY_TECH', 'BLOOD_BANK', 'QUALITY_OFFICER')")
    public ResponseEntity<ApiResponse<List<LabWorklistItemDto>>> getWorklist(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String query) {
        List<LabWorklistItemDto> worklist = labService.getWorklist(status, category, query);
        return ResponseEntity.ok(ApiResponse.success(worklist));
    }

    /**
     * Retrieves specific test investigation details.
     */
    @GetMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('LAB_TECH', 'LAB_MANAGER', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'PATIENT', 'NURSE', 'RADIOLOGIST', 'RADIOLOGY_TECH', 'BLOOD_BANK', 'MRD', 'QUALITY_OFFICER')")
    public ResponseEntity<ApiResponse<LabWorklistItemDto>> getTestDetails(@PathVariable UUID bookingId) {
        LabWorklistItemDto details = labService.getTestDetails(bookingId);
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    /**
     * Logs specimen collection (barcode, tube type, collection timestamp) for a test order.
     */
    @PostMapping("/{bookingId}/sample")
    @PreAuthorize("hasAnyRole('LAB_TECH', 'LAB_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'RADIOLOGY_TECH', 'BLOOD_BANK')")
    public ResponseEntity<ApiResponse<LabWorklistItemDto>> collectSample(
            @PathVariable UUID bookingId,
            @Valid @RequestBody LabSampleCollectionDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        LabWorklistItemDto updated = labService.collectSample(bookingId, dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Sample collected and logged to laboratory"));
    }

    /**
     * Records final test result findings, reference range, normal/abnormal flag, and signs off.
     */
    @PostMapping("/{bookingId}/result")
    @PreAuthorize("hasAnyRole('LAB_TECH', 'LAB_MANAGER', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'RADIOLOGIST')")
    public ResponseEntity<ApiResponse<LabWorklistItemDto>> recordResult(
            @PathVariable UUID bookingId,
            @Valid @RequestBody LabResultEntryDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        LabWorklistItemDto updated = labService.recordResult(bookingId, dto, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Laboratory test result recorded and verified"));
    }

    /**
     * Retrieves real-time laboratory operational statistics and metrics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('LAB_TECH', 'LAB_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'QUALITY_OFFICER')")
    public ResponseEntity<ApiResponse<LabStatsDto>> getLabStats() {
        LabStatsDto stats = labService.getLabStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}

