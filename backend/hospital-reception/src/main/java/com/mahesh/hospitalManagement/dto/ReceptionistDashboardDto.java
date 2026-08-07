package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceptionistDashboardDto {
    private long todayAppointments;
    private long walkinPatients;
    private long waitingPatients;
    private long checkedInPatients;
    private long completedConsultations;
    private long cancelledAppointments;
    private long doctorAvailabilityCount;
    private long pendingBillingCount;
    private double todayRevenue;
    private long emergencyPatients;
    private List<DoctorQueueStatusDto> doctorQueues;
    private List<String> announcements;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorQueueStatusDto {
        private UUID doctorId;
        private String doctorName;
        private String departmentName;
        private String roomNumber;
        private boolean isAvailable;
        private long waitingCount;
        private String currentToken;
    }
}
