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
@Table(name = "medicine_catalogue")
public class MedicineCatalogue extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String genericName;

    @Column(length = 50)
    private String dosageForm; // Tablet, Syrup, Injection, etc.

    @Column(length = 50)
    private String strength; // e.g. 500mg, 10ml

    @Column(length = 100)
    private String manufacturer;

    private Double unitPrice;
}
