package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionQueueItemDto {
    private UUID prescriptionId;
    private UUID consultationId;
    private UUID patientId;
    private String patientName;
    private String uhid;
    private Integer patientAge;
    private String patientGender;
    private String allergies; // Comma-separated recorded allergies
    private String doctorName;
    private String doctorSpecialization;
    private LocalDateTime issuedAt;
    private String status; // SUBMITTED, VERIFIED, PARTIALLY_DISPENSED, DISPENSED, REJECTED
    private String advice;
    private String verificationNotes;
    private String rejectionReason;
    private Boolean clarificationRequested;
    private String clarificationNotes;
    private List<PrescriptionLineItemDto> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionLineItemDto {
        private UUID itemId;
        private String medicineName;
        private String dosage;
        private String frequency;
        private String route;
        private Integer durationDays;
        private Integer prescribedQuantity;
        private Integer dispensedQuantity;
        private String instructions;
        private String batchNumber;
        private String itemStatus;
        private Integer availableStock;
    }
}
