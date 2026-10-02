package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceptionShiftHandoverDto {

    private UUID id;
    private LocalDate shiftDate;
    private String shiftType; // MORNING, EVENING, NIGHT
    private String outgoingStaff;
    private String incomingStaff;
    private BigDecimal cashCollected;
    private Integer totalTokensIssued;
    private Integer totalWalkinsHandled;
    private Integer totalEmergenciesHandled;
    private String pendingAppointmentsSummary;
    private String handoverNotes;
    private LocalDateTime createdAt;
}
