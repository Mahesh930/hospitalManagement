package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for the Doctor Clinical Dashboard containing operational queue, schedule, and patient metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDashboardDto {

    private UUID doctorId;
    private String doctorName;
    private String specialization;
    private String registrationNumber;
    private String roomNumber;
    private Double consultationFee;
    private Boolean isAvailable;

    // Metrics
    private long todayAppointmentsCount;
    private long waitingPatientsCount;
    private long inProgressCount;
    private long completedCount;

    // Active Clinical Queue
    private List<DoctorQueueItemDto> activeQueue;

    // Today's Consultation Schedule
    private List<DoctorScheduleSlotDto> todaySchedule;

    // Recent Consultations
    private List<RecentConsultationSummaryDto> recentPatients;

    // Critical clinical alerts (e.g. abnormal vitals, allergy risks)
    private List<String> criticalAlerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorQueueItemDto {
        private UUID appointmentId;
        private UUID visitId;
        private UUID patientId;
        private String tokenNumber;
        private Integer queueOrder;
        private String patientName;
        private String patientUhid;
        private Integer age;
        private String gender;
        private LocalDateTime appointmentTime;
        private String status; // WAITING_DOCTOR, IN_CONSULTATION, CHECKED_IN, COMPLETED
        private Integer priorityRank; // 0=Emergency, 1=VIP/Follow-up, 2=Standard
        private String chiefComplaint;

        // Triage Vitals Summary
        private String bloodPressure;
        private Double pulseRate;
        private Double temperature;
        private Double weight;
        private Double spo2;

        // Safety flags
        private Integer allergyCount;
        private List<String> allergyNames;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorScheduleSlotDto {
        private String slotTime;
        private String patientName;
        private String patientUhid;
        private String status; // COMPLETED, IN_PROGRESS, WAITING, UPCOMING, BREAK
        private UUID appointmentId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentConsultationSummaryDto {
        private UUID consultationId;
        private UUID appointmentId;
        private UUID patientId;
        private String patientName;
        private String patientUhid;
        private String icdCode;
        private String diagnosisNotes;
        private LocalDateTime completedAt;
        private Integer prescriptionItemCount;
    }
}
