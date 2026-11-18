package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorScheduleDto {

    private UUID doctorId;
    private String doctorName;
    private String specialization;
    private String departmentName;
    private String roomNumber;
    private String workingHours;
    private boolean isAvailable;
    private boolean isOnLeave;
    private String leaveReason;
    private int activeQueueCount;
    private int todayAppointmentsCount;
    private double consultationFee;
}
