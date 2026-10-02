package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Entity representing pharmacy replenishment and supplier purchase orders.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pharmacy_purchase_order")
public class PharmacyPurchaseOrder extends BaseEntity {

    @Column(nullable = false, unique = true, length = 60)
    private String poNumber;

    @Column(nullable = false, length = 150)
    private String supplierName;

    @Column(length = 100)
    private String supplierContact;

    @Column(nullable = false)
    private LocalDate orderDate;

    private LocalDate expectedDeliveryDate;

    private LocalDate receivedDate;

    @Column(length = 50)
    @Builder.Default
    private String status = "ORDERED"; // DRAFT, ORDERED, RECEIVED, PARTIALLY_RECEIVED, CANCELLED

    private Double totalAmount;

    @Column(columnDefinition = "TEXT")
    private String itemsJson; // Serialized list of PO items (medicine, quantity, rate)

    @Column(length = 255)
    private String notes;

    @Column(length = 100)
    private String createdByPharmacist;
}
