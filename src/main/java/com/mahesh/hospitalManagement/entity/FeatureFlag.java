package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "feature_flag")
public class FeatureFlag extends BaseEntity {

    @Column(nullable = false)
    private UUID hospitalId;

    @Column(nullable = false)
    private String moduleCode; // PHARMACY, RADIOLOGY, ICU, HR_PAYROLL, ABDM

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = true;
}
