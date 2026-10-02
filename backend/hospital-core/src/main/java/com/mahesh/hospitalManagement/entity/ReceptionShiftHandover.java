package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entity capturing front-desk reception shift handovers, cash reconciliation,
 * pending appointment issues, and administrative notes.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "reception_shift_handovers",
        indexes = {
                @Index(name = "idx_rec_handover_date", columnList = "shift_date"),
                @Index(name = "idx_rec_handover_shift", columnList = "shift_type")
        }
)
@SQLRestriction("deleted_at IS NULL")
public class ReceptionShiftHandover extends BaseEntity {

    @Column(name = "shift_date", nullable = false)
    private LocalDate shiftDate;

    @Column(name = "shift_type", nullable = false, length = 30)
    private String shiftType; // MORNING, EVENING, NIGHT

    @Column(name = "outgoing_staff", nullable = false, length = 100)
    private String outgoingStaff;

    @Column(name = "incoming_staff", length = 100)
    private String incomingStaff;

    @Column(name = "cash_collected", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cashCollected = BigDecimal.ZERO;

    @Column(name = "total_tokens_issued")
    @Builder.Default
    private Integer totalTokensIssued = 0;

    @Column(name = "total_walkins_handled")
    @Builder.Default
    private Integer totalWalkinsHandled = 0;

    @Column(name = "total_emergencies_handled")
    @Builder.Default
    private Integer totalEmergenciesHandled = 0;

    @Column(name = "pending_appointments_summary", length = 1000)
    private String pendingAppointmentsSummary;

    @Column(name = "handover_notes", nullable = false, length = 2000)
    private String handoverNotes;
}
