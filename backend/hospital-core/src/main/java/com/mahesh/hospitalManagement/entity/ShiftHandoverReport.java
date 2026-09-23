package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing structured nursing shift handover reports:
 * Ward census summary, critical patients summary, pending tasks,
 * and handover documentation between outgoing and incoming nursing teams.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "shift_handover_reports",
        indexes = {
                @Index(name = "idx_handover_ward", columnList = "ward_id"),
                @Index(name = "idx_handover_date", columnList = "shiftDate"),
                @Index(name = "idx_handover_shift", columnList = "shiftType")
        }
)
public class ShiftHandoverReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    /**
     * MORNING, EVENING, NIGHT
     */
    @Column(nullable = false, length = 30)
    private String shiftType;

    @Column(nullable = false)
    private LocalDate shiftDate;

    @Column(nullable = false, length = 100)
    private String outgoingNurse;

    @Column(length = 100)
    private String incomingNurse;

    private Integer totalInpatients;

    private Integer criticalPatientsCount;

    @Column(nullable = false, length = 3000)
    private String handoverSummary;

    @Column(length = 2000)
    private String pendingTasksSummary;

    @Column(nullable = false)
    private LocalDateTime handoverTime;
}
