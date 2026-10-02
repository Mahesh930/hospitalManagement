package com.mahesh.hospitalManagement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LostAndFoundItemDto {

    private UUID id;
    private String itemName;
    private String category; // VALUABLES, DOCUMENTS, ELECTRONICS, CLOTHING, OTHER
    private String description;
    private String foundLocation;
    private LocalDateTime foundDateTime;
    private String foundBy;
    private String storageLocation;
    private String status; // UNCLAIMED, CLAIMED, DISPOSED
    private String claimedBy;
    private String claimantContact;
    private String claimantIdProof;
    private LocalDateTime claimedDateTime;
    private String remarks;
    private LocalDateTime createdAt;
}
