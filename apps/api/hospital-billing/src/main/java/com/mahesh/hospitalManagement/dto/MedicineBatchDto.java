package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineBatchDto {
    private UUID id;
    private UUID medicineId;
    private String medicineName;
    private String genericName;
    private String dosageForm;
    private String strength;
    private String batchNumber;
    private LocalDate expiryDate;
    private LocalDate mfgDate;
    private Double purchasePrice;
    private Double mrp;
    private Double sellingPrice;
    private Integer quantityOnHand;
    private Integer quarantinedQuantity;
    private String storageLocation;
    private String status; // ACTIVE, NEAR_EXPIRY, EXPIRED, QUARANTINED, RECALLED
    private String supplierName;
    private Long daysUntilExpiry;
}
