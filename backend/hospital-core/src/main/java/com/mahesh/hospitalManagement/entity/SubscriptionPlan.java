package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "subscription_plan")
public class SubscriptionPlan extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code; // TRIAL, BASIC, STANDARD, PREMIUM, ENTERPRISE

    @Column(nullable = false)
    private String name;

    private BigDecimal monthlyPrice;

    private BigDecimal yearlyPrice;

    @Builder.Default
    private Integer maxDoctors = 10;

    @Builder.Default
    private Integer maxBeds = 50;

    @Builder.Default
    private Integer maxUsers = 25;

    @Builder.Default
    private Integer maxBranches = 1;

    @Builder.Default
    private Integer storageLimitGb = 10;
}
