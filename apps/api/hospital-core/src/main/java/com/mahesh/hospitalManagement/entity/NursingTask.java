package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing clinical nursing tasks, shift orders, and doctor order executions.
 * Supports task assignment, scheduling, priority tagging, and execution tracking.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "nursing_tasks",
        indexes = {
                @Index(name = "idx_task_ward", columnList = "ward_id"),
                @Index(name = "idx_task_patient", columnList = "patient_id"),
                @Index(name = "idx_task_status", columnList = "status"),
                @Index(name = "idx_task_due", columnList = "dueAt")
        }
)
public class NursingTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_admission_id")
    private BedAdmission bedAdmission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @Column(nullable = false, length = 150)
    private String taskTitle;

    @Column(length = 1000)
    private String description;

    /**
     * MEDICATION, VITALS_CHECK, DRESSING, LAB_COLLECTION, DOCTOR_ORDER, GENERAL_CARE, ASSESSMENT
     */
    @Column(nullable = false, length = 50)
    private String taskType;

    /**
     * ROUTINE, URGENT, STAT
     */
    @Column(nullable = false, length = 20)
    private String priority;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    private LocalDateTime dueAt;

    /**
     * PENDING, IN_PROGRESS, COMPLETED, CANCELLED
     */
    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 100)
    private String assignedNurse;

    @Column(length = 100)
    private String completedBy;

    private LocalDateTime completedAt;

    @Column(length = 500)
    private String completionNotes;
}
