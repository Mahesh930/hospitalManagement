package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.LabResultEntryDto;
import com.mahesh.hospitalManagement.dto.LabSampleCollectionDto;
import com.mahesh.hospitalManagement.dto.LabStatsDto;
import com.mahesh.hospitalManagement.dto.LabWorklistItemDto;
import com.mahesh.hospitalManagement.entity.DiagnosticBooking;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.DiagnosticBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Production implementation of laboratory and diagnostic management workflows.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LabServiceImpl implements LabService {

    private final DiagnosticBookingRepository diagnosticBookingRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<LabWorklistItemDto> getWorklist(String status, String category, String query) {
        List<DiagnosticBooking> bookings = diagnosticBookingRepository.findAll();

        return bookings.stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        return status.equalsIgnoreCase(b.getStatus());
                    }
                    return true;
                })
                .filter(b -> {
                    if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
                        return category.equalsIgnoreCase(b.getCategory());
                    }
                    return true;
                })
                .filter(b -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.trim().toLowerCase();
                        boolean matchPatient = b.getPatientName() != null && b.getPatientName().toLowerCase().contains(q);
                        boolean matchUhid = b.getPatientUhid() != null && b.getPatientUhid().toLowerCase().contains(q);
                        boolean matchTest = b.getTestName() != null && b.getTestName().toLowerCase().contains(q);
                        return matchPatient || matchUhid || matchTest;
                    }
                    return true;
                })
                .sorted((b1, b2) -> {
                    LocalDateTime t1 = b1.getBookingDateTime() != null ? b1.getBookingDateTime() : b1.getCreatedAt();
                    LocalDateTime t2 = b2.getBookingDateTime() != null ? b2.getBookingDateTime() : b2.getCreatedAt();
                    if (t1 == null) return 1;
                    if (t2 == null) return -1;
                    return t2.compareTo(t1);
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LabWorklistItemDto getTestDetails(UUID bookingId) {
        DiagnosticBooking booking = diagnosticBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnostic booking not found with ID: " + bookingId));
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public LabWorklistItemDto collectSample(UUID bookingId, LabSampleCollectionDto dto, String currentUser) {
        DiagnosticBooking booking = diagnosticBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnostic booking not found with ID: " + bookingId));

        if ("COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            throw new BusinessValidationException("Cannot collect sample for an already completed test.");
        }
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new BusinessValidationException("Cannot collect sample for a cancelled investigation.");
        }

        String oldStatus = booking.getStatus();
        booking.setStatus("SAMPLE_COLLECTED");

        StringBuilder notesBuilder = new StringBuilder();
        if (booking.getClinicalNotes() != null && !booking.getClinicalNotes().isBlank()) {
            notesBuilder.append(booking.getClinicalNotes()).append(" | ");
        }
        notesBuilder.append("Sample Barcode: ").append(dto.getBarcode())
                .append(" (").append(dto.getSpecimenType()).append(")");
        if (dto.getTechnicianNotes() != null && !dto.getTechnicianNotes().isBlank()) {
            notesBuilder.append(" - ").append(dto.getTechnicianNotes());
        }
        booking.setClinicalNotes(notesBuilder.toString());

        DiagnosticBooking saved = diagnosticBookingRepository.save(booking);

        auditService.logAction(
                currentUser,
                "COLLECT_LAB_SAMPLE",
                oldStatus,
                "SAMPLE_COLLECTED (Barcode: " + dto.getBarcode() + ")",
                null,
                null,
                null
        );

        log.info("Lab sample collected for booking ID: {}, Barcode: {}, By: {}", bookingId, dto.getBarcode(), currentUser);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public LabWorklistItemDto recordResult(UUID bookingId, LabResultEntryDto dto, String currentUser) {
        DiagnosticBooking booking = diagnosticBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Diagnostic booking not found with ID: " + bookingId));

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new BusinessValidationException("Cannot record result for a cancelled investigation.");
        }

        String oldStatus = booking.getStatus();
        booking.setStatus("COMPLETED");
        booking.setResultRecordedAt(LocalDateTime.now());
        booking.setIsAbnormal(dto.getIsAbnormal() != null && dto.getIsAbnormal());

        StringBuilder resultText = new StringBuilder();
        resultText.append(dto.getResultNotes());
        if (dto.getReferenceRange() != null && !dto.getReferenceRange().isBlank()) {
            resultText.append(" [Ref: ").append(dto.getReferenceRange()).append("]");
        }
        if (dto.getTechnicianNotes() != null && !dto.getTechnicianNotes().isBlank()) {
            resultText.append(" (Notes: ").append(dto.getTechnicianNotes()).append(")");
        }
        booking.setResultNotes(resultText.toString());

        if (dto.getResultAttachmentUrl() != null && !dto.getResultAttachmentUrl().isBlank()) {
            booking.setResultAttachmentUrl(dto.getResultAttachmentUrl());
        }

        DiagnosticBooking saved = diagnosticBookingRepository.save(booking);

        auditService.logAction(
                currentUser,
                "RECORD_LAB_RESULT",
                oldStatus,
                "COMPLETED (" + (Boolean.TRUE.equals(booking.getIsAbnormal()) ? "ABNORMAL" : "NORMAL") + ")",
                null,
                null,
                null
        );

        log.info("Lab test result recorded for booking ID: {}, Abnormal: {}, By: {}", bookingId, saved.getIsAbnormal(), currentUser);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public LabStatsDto getLabStats() {
        List<DiagnosticBooking> all = diagnosticBookingRepository.findAll();
        LocalDate today = LocalDate.now();

        long totalToday = 0;
        long pendingSamples = 0;
        long samplesCollected = 0;
        long inProgress = 0;
        long completedToday = 0;
        long abnormal = 0;

        for (DiagnosticBooking b : all) {
            if (b.getDeletedAt() != null) continue;
            LocalDate bookingDate = b.getBookingDateTime() != null ? b.getBookingDateTime().toLocalDate() : null;

            if (bookingDate != null && bookingDate.isEqual(today)) {
                totalToday++;
            }

            String s = b.getStatus() != null ? b.getStatus().toUpperCase() : "SCHEDULED";
            if ("SCHEDULED".equals(s) || "BOOKED".equals(s)) {
                pendingSamples++;
            } else if ("SAMPLE_COLLECTED".equals(s)) {
                samplesCollected++;
            } else if ("IN_PROGRESS".equals(s)) {
                inProgress++;
            } else if ("COMPLETED".equals(s) || "RESULT_ENTERED".equals(s)) {
                if (b.getResultRecordedAt() != null && b.getResultRecordedAt().toLocalDate().isEqual(today)) {
                    completedToday++;
                } else if (bookingDate != null && bookingDate.isEqual(today)) {
                    completedToday++;
                }
            }

            if (Boolean.TRUE.equals(b.getIsAbnormal())) {
                abnormal++;
            }
        }

        return LabStatsDto.builder()
                .totalTestsScheduledToday(totalToday)
                .pendingSampleCollection(pendingSamples)
                .samplesCollected(samplesCollected)
                .inProgressTests(inProgress)
                .completedToday(completedToday)
                .abnormalResultsCount(abnormal)
                .totalOverallTests((long) all.size())
                .build();
    }

    private LabWorklistItemDto mapToDto(DiagnosticBooking b) {
        return LabWorklistItemDto.builder()
                .id(b.getId())
                .patientId(b.getPatientId())
                .patientName(b.getPatientName())
                .patientUhid(b.getPatientUhid())
                .testName(b.getTestName())
                .category(b.getCategory())
                .bookingDateTime(b.getBookingDateTime())
                .status(b.getStatus())
                .referringDoctorId(b.getReferringDoctorId())
                .referringDoctorName(b.getReferringDoctorName())
                .departmentName(b.getDepartmentName())
                .instructions(b.getInstructions())
                .clinicalNotes(b.getClinicalNotes())
                .resultNotes(b.getResultNotes())
                .resultAttachmentUrl(b.getResultAttachmentUrl())
                .resultRecordedAt(b.getResultRecordedAt())
                .isAbnormal(b.getIsAbnormal())
                .bookedBy(b.getBookedBy())
                .createdAt(b.getCreatedAt())
                .build();
    }
}

