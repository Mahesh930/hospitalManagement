package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity for patient medicine returns and supplier returns.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pharmacy_return")
public class PharmacyReturn extends BaseEntity {

    @Column(nullable = false, unique = true, length = 60)
    private String returnNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispense_record_id")
    private PharmacyDispenseRecord dispenseRecord;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private MedicineCatalogue medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    private MedicineBatch batch;

    @Column(nullable = false)
    private Integer returnQuantity;

    private Double refundAmount;

    @Column(length = 50)
    @Builder.Default
    private String disposition = "RETURN_TO_STOCK"; // RETURN_TO_STOCK, QUARANTINE_WASTE, DAMAGED

    @Column(length = 255)
    private String reason;

    @Column(length = 50)
    @Builder.Default
    private String status = "APPROVED_RESTOCKED"; // SUBMITTED, APPROVED_RESTOCKED, WRITTEN_OFF

    @Column(nullable = false, length = 100)
    private String processedBy;
}
