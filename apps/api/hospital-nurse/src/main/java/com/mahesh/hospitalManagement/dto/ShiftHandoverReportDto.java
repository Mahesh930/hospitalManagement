package com.mahesh.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftHandoverReportDto {
    private UUID id;
    private UUID wardId;
    private String wardName;
    private String shiftType; // MORNING, EVENING, NIGHT
    private LocalDate shiftDate;
    private String outgoingNurse;
    private String incomingNurse;
    private Integer totalInpatients;
    private Integer criticalPatientsCount;
    private String handoverSummary;
    private String pendingTasksSummary;
    private LocalDateTime handoverTime;
}
