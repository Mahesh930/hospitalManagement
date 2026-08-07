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
@Table(name = "diagnosis_catalogue")
public class DiagnosisCatalogue extends BaseEntity {

    @Column(nullable = false, unique = true, length = 20)
    private String icdCode; // e.g., J45.909

    @Column(nullable = false, length = 255)
    private String description;

    @Column(length = 100)
    private String category;
}
