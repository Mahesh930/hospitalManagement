package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "charge_master")
public class ChargeMaster extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String itemCode;

    @Column(nullable = false, length = 150)
    private String itemName;

    @Column(nullable = false, length = 50)
    private String category; // CONSULTATION, PROCEDURE, LAB, PHARMACY, REGISTRATION

    @Column(nullable = false)
    private Double standardPrice;

    @Column(nullable = false)
    private Double gstPercentage; // e.g. 0.0, 5.0, 18.0
}
