package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing regulatory or hospital-initiated medicine recalls.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "medicine_recall")
public class MedicineRecall extends BaseEntity {

    @Column(nullable = false, unique = true, length = 60)
    private String recallNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private MedicineCatalogue medicine;

    @Column(nullable = false, length = 60)
    private String batchNumber;

    @Column(columnDefinition = "TEXT")
    private String recallReason;

    @Builder.Default
    private Integer quarantinedQuantity = 0;

    @Column(nullable = false, length = 100)
    private String initiatedBy;

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, RESOLVED
}
