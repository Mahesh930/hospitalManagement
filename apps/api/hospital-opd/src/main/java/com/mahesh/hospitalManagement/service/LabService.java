package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.LabResultEntryDto;
import com.mahesh.hospitalManagement.dto.LabSampleCollectionDto;
import com.mahesh.hospitalManagement.dto.LabStatsDto;
import com.mahesh.hospitalManagement.dto.LabWorklistItemDto;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Laboratory & Diagnostic investigations, sample collection,
 * result logging, and critical alert verification.
 */
public interface LabService {
    List<LabWorklistItemDto> getWorklist(String status, String category, String query);

    LabWorklistItemDto getTestDetails(UUID bookingId);

    LabWorklistItemDto collectSample(UUID bookingId, LabSampleCollectionDto dto, String currentUser);

    LabWorklistItemDto recordResult(UUID bookingId, LabResultEntryDto dto, String currentUser);

    LabStatsDto getLabStats();
}

